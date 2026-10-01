import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import { lookupGlossary, translateComposed } from "@/lib/demo-glossary";

export const runtime = "nodejs";

const TARGET_LANGUAGES = ["hi", "gu"] as const;
type TargetLanguage = (typeof TARGET_LANGUAGES)[number];

const LANG_NAMES: Record<TargetLanguage, string> = {
  hi: "Hindi (Devanagari script)",
  gu: "Gujarati (Gujarati script)",
};

const RequestSchema = z.object({
  texts: z.array(z.string().min(1)).min(1).max(40),
  targetLang: z.enum(TARGET_LANGUAGES),
});

/**
 * Object-mode schema: { data: unknown JSON structure, targetLanguage: "hi"|"gu" }
 * Translates ALL narrative string values in one batched request (full graph
 * structures, conflict payloads, coach data) while keys/ids/timestamps/numbers
 * pass through untouched.
 */
const ObjectRequestSchema = z.object({
  data: z.unknown(),
  targetLanguage: z.enum(TARGET_LANGUAGES),
});

/**
 * POST /api/translate
 * Body: { texts: string[], targetLang: "hi" | "gu" }
 * Returns: { success, translations: string[], cached: boolean }
 *
 * Translates stored user content (statements, atomic claims, evidence findings,
 * coach questions) on-the-fly. NEVER mutates the original strings — callers keep
 * the verbatim source text so the SHA-256 hash audit chain stays intact.
 *
 * Degrades gracefully: if GROQ_API_KEY is missing the endpoint returns success
 * with `translations: null` and the UI falls back to original verbatim text.
 */
/**
 * POST /api/translate (object mode)
 * Body: { data: unknown, targetLanguage: "hi" | "gu" }
 * Returns: { translatedData } — same structure with narrative values translated.
 *
 * Uses ChatGroq (llama-3.3-70b-versatile) to translate the full JSON payload in
 * a single request. Degrades gracefully: on any failure returns the original
 * data so the UI renders verbatim source text (audit-chain safe).
 */
/**
 * OFFLINE-FIRST lookup for object mode: walks the whole JSON structure and
 * translates every narrative string via the demo glossary (bundled demo data
 * renders 100% natively without any API key). Strings with no glossary entry
 * are collected and translated via Groq in the same request.
 */
function glossaryWalkObject(
  value: unknown,
  targetLanguage: TargetLanguage,
  missCollector: string[]
): unknown {
  if (typeof value === "string") {
    const hit = lookupGlossary(value, targetLanguage);
    if (hit !== null) return hit;
    // Composed strings (decision lines) get fragment-level translation
    const composed = translateComposed(value, targetLanguage);
    if (composed !== null) return composed;
    missCollector.push(value);
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => glossaryWalkObject(item, targetLanguage, missCollector));
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = glossaryWalkObject(val, targetLanguage, missCollector);
    }
    return out;
  }
  return value;
}

async function translateObject(
  data: unknown,
  targetLanguage: TargetLanguage
): Promise<{ translatedData: unknown }> {
  if (!data) {
    return { translatedData: data };
  }

  // Offline glossary pass first (deterministic, zero-latency, key-free)
  const groqMisses: string[] = [];
  const glossaryResult = glossaryWalkObject(data, targetLanguage, groqMisses);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || groqMisses.length === 0) {
    return { translatedData: glossaryResult };
  }

  const targetLang = LANG_NAMES[targetLanguage];
  const prompt = `You are a legal and investigative translator. Translate ALL string values inside the following JSON object into ${targetLang}.
Keep keys, IDs, timestamps, and numbers intact. Only translate human-readable narrative text, conflict descriptions, questions, quotes, and graph labels.
Never translate hash strings, enum-like code tokens (e.g. "time_conflict", "SHA-256"), case IDs, or dates.
Respond ONLY with the translated JSON object — no markdown fences, no commentary.

JSON Input:
${JSON.stringify({ data: groqMisses })}`;

  try {
    const model = new ChatGroq({
      apiKey,
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });
    const response = await model.invoke(prompt);
    const cleanedText = response.content
      .toString()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleanedText) as { data?: unknown[] };
    const groqTranslations = Array.isArray(parsed.data) ? parsed.data : null;

    // Re-merge: glossary hits stay, Groq misses get their translations in order
    let groqIndex = 0;
    const mergeMisses = (node: unknown): unknown => {
      if (typeof node === "string") {
        const direct = lookupGlossary(node, targetLanguage);
        const composed = direct !== null ? direct : translateComposed(node, targetLanguage);
        if (composed !== null) return composed;
        const replacement = groqTranslations?.[groqIndex];
        groqIndex += 1;
        return typeof replacement === "string" && replacement ? replacement : node;
      }
      if (Array.isArray(node)) return node.map(mergeMisses);
      if (node !== null && typeof node === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          out[k] = mergeMisses(v);
        }
        return out;
      }
      return node;
    };

    return { translatedData: mergeMisses(data) };
  } catch (error) {
    console.error("Batch Translation Error:", error);
    return { translatedData: glossaryResult };
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  // Object mode: { data, targetLanguage } — batch JSON payload translation
  const objectParsed = ObjectRequestSchema.safeParse(body);
  if (objectParsed.success) {
    const { translatedData } = await translateObject(
      objectParsed.data.data,
      objectParsed.data.targetLanguage
    );
    return NextResponse.json({ translatedData });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request payload", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { texts, targetLang } = parsed.data;

  // OFFLINE-FIRST: glossary-resolved strings never hit the API. Mixed arrays
  // (part glossary, part live) still translate the remainder via Groq.
  const glossaryHits = new Map<number, string>();
  const remaining: { index: number; text: string }[] = [];
  texts.forEach((text, index) => {
    const direct = lookupGlossary(text, targetLang);
    if (direct !== null) {
      glossaryHits.set(index, direct);
      return;
    }
    const composed = translateComposed(text, targetLang);
    if (composed !== null) {
      glossaryHits.set(index, composed);
      return;
    }
    remaining.push({ index, text });
  });

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    if (glossaryHits.size > 0 && remaining.length === 0) {
      const all = texts.map((_, i) => glossaryHits.get(i) ?? texts[i]);
      return NextResponse.json({ success: true, translations: all, cached: false });
    }
    return NextResponse.json({
      success: true,
      translations: null,
      cached: false,
      reason: "GROQ_API_KEY not configured — serving original text",
    });
  }

  const systemPrompt = `You are a professional translator for a forensic evidence-verification application.
Translate each numbered input text into ${LANG_NAMES[targetLang]}.
RULES:
1. Preserve meaning, tone, and forensic terminology precisely.
2. Keep proper nouns, case IDs, hash strings, timestamps, numbers, and code-like tokens (e.g. "SHA-256", "C-1", "14:02") unchanged.
3. Keep quotes and question marks natural for the target language.
4. Never add commentary, notes, or explanations.
5. Respond ONLY with a JSON object of the form: {"translations": ["...", "...", ...]} where the array has EXACTLY the same number of items, in the same order, as the numbered inputs.`;

  const numbered = remaining.map((r, i) => `${i + 1}. ${r.text}`).join("\n");
  const userPrompt = `Translate these ${remaining.length} text(s):\n${numbered}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq translation API error:", errText);
      return NextResponse.json(
        { success: true, translations: null, reason: "Translation service unavailable" },
        { status: 200 }
      );
    }

    const data = await res.json();
    const content: string =
      typeof data?.choices?.[0]?.message?.content === "string"
        ? data.choices[0].message.content
        : "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: true, translations: null, reason: "Malformed translation response" },
        { status: 200 }
      );
    }

    const parsedOutput = JSON.parse(jsonMatch[0]) as { translations?: unknown };
    const translations = Array.isArray(parsedOutput.translations)
      ? (parsedOutput.translations as unknown[]).map((v) =>
          typeof v === "string" ? v : String(v ?? "")
        )
      : null;

    if (!translations || translations.length !== remaining.length) {
      return NextResponse.json(
        { success: true, translations: null, reason: "Translation count mismatch" },
        { status: 200 }
      );
    }

    // Merge glossary hits + Groq results back into the original positions
    const merged = texts.map((original, i) => {
      const hit = glossaryHits.get(i);
      if (hit !== undefined) return hit;
      const pos = remaining.findIndex((r) => r.index === i);
      return translations[pos] ?? original;
    });

    return NextResponse.json({ success: true, translations: merged, cached: false });
  } catch (error: unknown) {
    console.error("Translate API error:", error);
    return NextResponse.json(
      { success: true, translations: null, reason: "Translation request failed" },
      { status: 200 }
    );
  }
}
