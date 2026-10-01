import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ExtractedClaimSchema } from "@/agent/schemas";

export const runtime = "nodejs";

function employerFromLine(line: string): string | null {
  const m = line.match(/(?:at|@)\s+([A-Z][\w&.,' ]{2,50})/);
  if (!m) return null;
  // Strip a trailing year fragment the greedy match may swallow ("Nexus Corp 2019")
  return m[1].replace(/\s+(?:19|20)\d{2}\s*$/g, "").trim() || null;
}

function degreeClaimText(line: string): string {
  const degreeMatch = line.match(
    /\b(?:B\.?Tech|B\.?E|B\.?Sc|B\.?Com|M\.?Tech|M\.?Sc|MBA|Ph\.?D)\b/i
  );
  return degreeMatch ? `Holds degree: ${degreeMatch[0]}` : line;
}

function institutionFromLine(line: string): string | null {
  const m = line.match(/(?:from|at|university of|college)\s+([A-Z][\w&.,' ]{2,50})/);
  return m ? m[1].trim() : null;
}

/**
 * Heuristic atomic-claim extraction from resume text.
 * Pure string analysis - no external API needed, works without GROQ_API_KEY.
 * Every claim quotes the verbatim resume line so the SHA-256 audit chain
 * can always reference the original document text.
 */
function extractResumeClaims(resumeText: string): z.infer<typeof ExtractedClaimSchema>[] {
  const lines = resumeText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 8);

  const claims: z.infer<typeof ExtractedClaimSchema>[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Employment-tenure pattern, e.g. "Software Engineer at Acme Corp 2019-2022"
    const tenure = line.match(
      /(?:19|20)\d{2}\s*[-\u2013\u2014]{1,2}\s*(?:(?:19|20)\d{2}|present|current)/i
    );
    // Skill-assertion pattern: "Skilled in X", "Proficient in Y"
    const skill = line.match(
      /\b(?:proficient in|skilled in|expertise in|experienced with)\b\s+(.{2,80})/i
    );
    // Degree pattern
    const degree = line.match(
      /\b(?:B\.?Tech|B\.?E|B\.?Sc|B\.?Com|M\.?Tech|M\.?Sc|MBA|Ph\.?D)\b/i
    );

    if (tenure) {
      claims.push({
        id: `resume-claim-${i}`,
        source_quote: line,
        who: null,
        what: line,
        place: employerFromLine(line),
        time_expression: tenure[0],
        time_start: null,
        time_end: null,
        unknown_slots: ["who"],
        status: "verified",
      });
    } else if (skill) {
      claims.push({
        id: `resume-claim-${i}`,
        source_quote: line,
        who: null,
        what: line,
        place: employerFromLine(line),
        time_expression: null,
        time_start: null,
        time_end: null,
        unknown_slots: ["who"],
        status: "verified",
      });
    } else if (degree) {
      claims.push({
        id: `resume-claim-${i}`,
        source_quote: line,
        who: null,
        what: degreeClaimText(line),
        place: institutionFromLine(line),
        time_expression: null,
        time_start: null,
        time_end: null,
        unknown_slots: ["who"],
        status: "verified",
      });
    }
  }

  return claims;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No resume file uploaded" },
        { status: 400 }
      );
    }

    const blob = file as File;
    let resumeText = "";

    if (
      blob.type === "application/pdf" ||
      blob.name?.toLowerCase().endsWith(".pdf")
    ) {
      const { PDFParse } = await import("pdf-parse");
      const buffer = Buffer.from(await blob.arrayBuffer());
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const textResult = await parser.getText();
        resumeText = textResult.text;
      } finally {
        await parser.destroy();
      }
    } else {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({
        buffer: Buffer.from(await blob.arrayBuffer()),
      });
      resumeText = value;
    }

    const claims = extractResumeClaims(resumeText);

    return NextResponse.json({
      success: true,
      fileName: blob.name,
      claims,
      resumeTextLength: resumeText.length,
    });
  } catch (error: unknown) {
    console.error("Resume analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Resume parsing failed",
      },
      { status: 500 }
    );
  }
}
