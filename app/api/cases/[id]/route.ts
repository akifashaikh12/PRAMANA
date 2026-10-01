import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateCaseSafe, getCaseSafe } from "@/lib/supabase-service";

const PatchCaseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  mode: z.enum(["diary", "investigation", "hiring"]).optional(),
  changedBy: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/cases/[id] — single case metadata. */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const found = await getCaseSafe(id);
  if (!found) {
    return NextResponse.json(
      { success: false, error: "Case not found or persistence unconfigured" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, case: found });
}

/**
 * PATCH /api/cases/[id] — update title/mode. Bumps version, refreshes
 * updated_at, and writes a CASE_UPDATED audit row with previous/new state.
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const parsed = PatchCaseSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }
    if (parsed.data.title === undefined && parsed.data.mode === undefined) {
      return NextResponse.json(
        { success: false, error: "Nothing to update: provide title and/or mode" },
        { status: 400 }
      );
    }

    const updated = await updateCaseSafe(id, parsed.data);
    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Update failed: case not found, SUPABASE unconfigured, or migration not applied.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, case: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/cases/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
