import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runPramanaPipeline } from "@/agent/graph";
import { ModeConfig } from "@/agent/schemas";
import investigationConfig from "@/modes/investigation.json";
import hiringConfig from "@/modes/hiring.json";
import diaryConfig from "@/modes/diary.json";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// CORS — allows external automated evaluation scripts (judges) to call this
// endpoint cleanly from any origin.
// ---------------------------------------------------------------------------

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function withCors(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.headers.set(key, value);
  }
  return res;
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ status: "error", message }, { status });
}

/** Preflight handler — required for browser-based evaluation clients. */
export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/** Explicit 405 for every non-POST method. */
export async function GET() {
  return withCors(jsonError("Method Not Allowed. Use POST.", 405));
}

export async function PUT() {
  return withCors(jsonError("Method Not Allowed. Use POST only.", 405));
}

export async function DELETE() {
  return withCors(jsonError("Method Not Allowed. Use POST only.", 405));
}

export async function PATCH() {
  return withCors(jsonError("Method Not Allowed. Use POST only.", 405));
}

// ---------------------------------------------------------------------------
// Request validation — competition-spec fields:
//   input  (string, required)  — statement, witness log, or candidate input
//   mode   (string, optional)  — "investigation" | "hiring" | "diary" (default "investigation")
//   caseId (string, optional)  — existing case to reconcile against
// ---------------------------------------------------------------------------

const VerifyRequestSchema = z.object({
  input: z.string().min(1, "input is required").max(20_000),
  mode: z.enum(["investigation", "hiring", "diary"]).default("investigation"),
  caseId: z.string().optional(),
});

const MODE_CONFIGS: Record<string, ModeConfig> = {
  investigation: investigationConfig as ModeConfig,
  hiring: hiringConfig as ModeConfig,
  diary: diaryConfig as ModeConfig,
};

// ---------------------------------------------------------------------------
// POST — the judging endpoint.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // 1) Parse + validate -------------------------------------------------
    const body = await req.json().catch(() => null);
    if (body === null) {
      return withCors(jsonError("Request body must be valid JSON.", 400));
    }

    const parsed = VerifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      return withCors(jsonError(`Invalid request payload: ${detail}`, 400));
    }

    const { input, mode, caseId } = parsed.data;

    // 2) SHA-256 of the verbatim input string ------------------------------
    const sha256 = crypto.createHash("sha256").update(input, "utf8").digest("hex");

    // 3) Run the Pramana LangGraph pipeline --------------------------------
    //    (deterministic fallbacks keep this working even if GROQ_API_KEY is
    //    unreachable, so judges never hit a hard 500 from the LLM provider)
    const modeConfig = MODE_CONFIGS[mode] ?? (investigationConfig as ModeConfig);

    const finalState = await runPramanaPipeline({
      caseId: caseId || `verify-${Date.now()}`,
      modeConfig,
      statement: input,
      narrator: "API Submission",
      statementDate: new Date().toISOString(),
      extractedClaims: [],
      evidenceList: [],
      userClarificationAnswer: null,
      unresolvedSlots: [],
    });

    // 4) Extract judge-relevant outputs -------------------------------------
    const agentOutput = {
      extracted_claims: finalState.extractedClaims ?? [],
      conflicts_detected: (finalState.findings ?? []).map((finding) => ({
        type: finding.type,
        status: finding.status,
        claim_id: finding.claim_id ?? null,
        evidence_id: finding.evidence_id ?? null,
        explanation: finding.explanation,
      })),
      // The pipeline parks the question in clarificationQuestion on the
      // clarification path, and in nextBestQuestion otherwise — cover both.
      coach_question:
        finalState.nextBestQuestion?.question ??
        finalState.clarificationQuestion ??
        "",
    };

    // 5) Spec-exact success response -----------------------------------------
    return withCors(
      NextResponse.json(
        {
          status: "success",
          timestamp: new Date().toISOString(),
          sha256,
          mode,
          agent_output: agentOutput,
        },
        { status: 200 }
      )
    );
  } catch (error: unknown) {
    console.error("POST /api/verify error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return withCors(jsonError(message, 500));
  }
}


Freebuff 0.0.155 installs when idle
Waiting for 1 session to end at 7:33 PM.
