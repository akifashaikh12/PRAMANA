import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCaseSafe, listCasesSafe } from "@/lib/supabase-service";

const CreateCaseSchema = z.object({
  title: z.string().min(1).max(200),
  mode: z.enum(["diary", "investigation", "hiring"]),
  changedBy: z.string().optional(),
});

/** GET /api/cases — list case metadata (updated_at desc). */
export async function GET() {
  const cases = await listCasesSafe();
  return NextResponse.json({ success: true, cases });
}

/** POST /api/cases — create a case (version 1) + CASE_CREATED audit entry. */
export async function POST(req: NextRequest) {
  try {
    const parsed = CreateCaseSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const created = await createCaseSafe(parsed.data);
    if (!created) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Case persistence unavailable: SUPABASE env vars are not configured or the cases table is missing (run supabase/migrations/20260929_case_audit_logs.sql).",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, case: created });
  } catch (error: unknown) {
    console.error("POST /api/cases error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
