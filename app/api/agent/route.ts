import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runPramanaPipeline } from "@/agent/graph";
import { ModeConfig, EvidenceSchema, ExtractedClaimSchema } from "@/agent/schemas";
import { computeStatementHash, GENESIS_HASH } from "@/tools";
import { persistStatementSafe, persistClaimsSafe } from "@/lib/supabase";
import investigationConfig from "@/modes/investigation.json";
import hiringConfig from "@/modes/hiring.json";
import diaryConfig from "@/modes/diary.json";

const RequestSchema = z.object({
  caseId: z.string().optional(),
  statement: z.string().default(""),
  narrator: z.string().default("Anonymous"),
  statementDate: z.string().optional(),
  mode: z.enum(["investigation", "hiring", "diary"]).default("investigation"),
  evidenceList: z.array(EvidenceSchema).default([]),
  existingClaims: z.array(ExtractedClaimSchema).default([]),
  userClarificationAnswer: z.string().nullable().optional(),
  unresolvedSlots: z
    .array(
      z.object({
        claimIndex: z.number(),
        claimQuote: z.string(),
        slot: z.string(),
      })
    )
    .default([]),
  prevHash: z.string().default(GENESIS_HASH),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Select mode configuration
    let modeConfig: ModeConfig;
    if (data.mode === "investigation") {
      modeConfig = investigationConfig as ModeConfig;
    } else if (data.mode === "hiring") {
      modeConfig = hiringConfig as ModeConfig;
    } else {
      modeConfig = diaryConfig as ModeConfig;
    }

    const statementDate = data.statementDate || new Date().toISOString();
    const createdAt = new Date().toISOString();

    // Compute cryptographic hash of statement if statement text is provided
    let newHash = "";
    if (data.statement.trim()) {
      newHash = computeStatementHash(
        data.prevHash,
        data.narrator,
        data.statement,
        createdAt
      );
    }

    // Run LangGraph pipeline
    const finalState = await runPramanaPipeline({
      caseId: data.caseId || `case-${Date.now()}`,
      modeConfig,
      statement: data.statement,
      narrator: data.narrator,
      statementDate,
      extractedClaims: data.existingClaims,
      evidenceList: data.evidenceList,
      userClarificationAnswer: data.userClarificationAnswer || null,
      unresolvedSlots: data.unresolvedSlots,
    });

    // Gracefully persist to Supabase if configured (silently skips if unconfigured)
    if (newHash && data.statement.trim()) {
      const statementId = `st-${Date.now()}`;
      persistStatementSafe({
        id: statementId,
        case_id: data.caseId,
        narrator: data.narrator,
        body: data.statement,
        statement_date: statementDate,
        prev_hash: data.prevHash,
        hash: newHash,
        created_at: createdAt,
      }).catch(() => {});

      if (finalState.extractedClaims && finalState.extractedClaims.length > 0) {
        persistClaimsSafe(finalState.extractedClaims, statementId).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      state: finalState,
      hashMetadata: newHash
        ? {
            prevHash: data.prevHash,
            currentHash: newHash,
            narrator: data.narrator,
            createdAt,
          }
        : null,
    });
  } catch (error: unknown) {
    console.error("PRAMANA Agent Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
