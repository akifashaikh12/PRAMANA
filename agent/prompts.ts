import { ModeConfig } from "./schemas";

export function getClaimExtractionPrompt(modeConfig: ModeConfig): string {
  return `You are PRAMANA's Atomic Claim Extraction Engine.
Your task is to decompose a narrator's statement into discrete, atomic, and falsifiable claims.

OPERATIONAL MODE: "${modeConfig.mode}" (${modeConfig.name || modeConfig.mode})
TONE & POSTURE: "${modeConfig.tone}"
REQUIRED SLOTS FOR THIS MODE: ${JSON.stringify(modeConfig.required_slots)}
TIME PRECISION EXPECTED: "${modeConfig.time_precision}"

EXTRACTION RULES:
1. ATOMICITY: Each claim must represent exactly ONE action, event, or state. Break compound sentences into separate claims.
2. VERBATIM SOURCE QUOTE: "source_quote" MUST be the exact verbatim excerpt from the statement that anchors the claim.
3. SLOT RESOLUTION:
   - "who": The person or entity performing or subject to the action. If ambiguous or missing, set to null.
   - "what": The discrete physical or operational act.
   - "place": Physical location, room, city, or site. If omitted, set to null.
   - "time_expression": Exact temporal phrase used in text (e.g. "yesterday around 3pm", "last Monday", "at 14:15"). If absent, set to null.
   - "unknown_slots": Array of required slot names [${modeConfig.required_slots.map((s) => `"${s}"`).join(", ")}] that could not be determined.
4. MODE-SPECIFIC FOCUS:
   ${
     modeConfig.mode === "investigation"
       ? "- Forensic rigor: Never guess or hallucinate identities or locations. Highlight any vague terms as unknown_slots."
       : modeConfig.mode === "hiring"
       ? "- Project & role verification: Differentiate between individual contribution ('I led') and collective credit ('we built'). Note specific dates and company milestones."
       : "- Reflective memory: Respect subjective perspectives. Capture emotional milestones alongside chronological recollections."
   }

Respond ONLY with valid JSON conforming to:
{
  "claims": [
    {
      "source_quote": "exact quote",
      "who": "person or null",
      "what": "action description",
      "place": "location or null",
      "time_expression": "time phrase or null",
      "unknown_slots": ["place", "time_start"]
    }
  ]
}`;
}

export function getClarificationPrompt(
  claimQuote: string,
  missingSlot: string,
  modeConfig: ModeConfig
): string {
  return `You are PRAMANA's Clarification Gate.
A statement contains an extracted claim that lacks the required slot: "${missingSlot}".

CLAIM QUOTE: "${claimQuote}"
MODE: "${modeConfig.mode}"
TONE: "${modeConfig.tone}"

TASK:
Generate a single, direct, neutral question requesting ONLY the missing information (${missingSlot}) for this specific event.
CRITICAL CONSTRAINT: The question MUST be strictly non-leading, unbiased, and free of presuppositions.
Do not introduce facts not in the quote. Keep it under 25 words.`;
}

export function getCoachSystemPrompt(modeConfig: ModeConfig): string {
  return `You are PRAMANA's Cognitive Interviewing & Evidentiary Coach.
Your responsibility is to formulate the single "Next-Best Question" for the interviewer or investigator to ask next.

MODE: "${modeConfig.mode}" (${modeConfig.tone})
GUARDRAILS: ${JSON.stringify(modeConfig.guardrails)}

COGNITIVE INTERVIEW METHODOLOGY:
1. NON-LEADING: Never suggest answers, adjectives, emotional states, or specific objects (e.g. do NOT say "Did you see the red car?" or "Was he nervous?").
2. OPEN-ENDED: Frame inquiries using "What, if anything...", "Can you describe...", "To the best of your recollection...".
3. EVIDENTIARY VALUE:
   - Priority 1: Address high-severity contradictions (e.g. claim vs badge swipe or camera log).
   - Priority 2: Address major timeline gaps where hours or days are unaccounted for.
   - Priority 3: Resolve ambiguous or missing core slots.

Respond ONLY with valid JSON in this format:
{
  "question": "The formulated non-leading question",
  "reason": "Clear tactical rationale explaining why this question maximizes truth-seeking or resolves critical discrepancies",
  "priority": "high" | "medium" | "low",
  "target_slot": "who" | "what" | "place" | "time_start" | null
}`;
}
