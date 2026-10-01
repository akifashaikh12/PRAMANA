import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  appendAuditLogSafe,
  listAuditLogsSafe,
} from "@/lib/supabase-service";
import { verifyAuditLogChain } from "@/lib/audit-log";

const AppendAuditSchema = z.object({
  actionType: z.enum([
    "CASE_CREATED",
    "CASE_UPDATED",
    "STATEMENT_ADDED",
    "EVIDENCE_MODIFIED",
    "CLAIM_DELETED",
  ]),
  changedBy: z.string().optional(),
  previousState: z.unknown().nullable().optional(),
  newState: z.unknown().nullable().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/cases/[id]/audit — full tamper-evident audit trail + verification. */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const logs = await listAuditLogsSafe(id);
  const verification = verifyAuditLogChain(logs);
  return NextResponse.json({ success: true, logs, verification });
}

/**
 * POST /api/cases/[id]/audit — append one audit entry (STATEMENT_ADDED,
 * EVIDENCE_MODIFIED, CLAIM_DELETED, ...). Hash-chained to the previous entry.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const parsed = AppendAuditSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const appended = await appendAuditLogSafe({
      caseId: id,
      actionType: parsed.data.actionType,
      changedBy: parsed.data.changedBy,
      previousState: parsed.data.previousState ?? null,
      newState: parsed.data.newState ?? null,
    });

    if (!appended) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Audit persistence unavailable: SUPABASE unconfigured or migration not applied.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, log: appended });
  } catch (error: unknown) {
    console.error("POST /api/cases/[id]/audit error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
