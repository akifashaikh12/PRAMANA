import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  StatementRecord,
  ExtractedClaim,
  Finding,
  Evidence,
} from "@/agent/schemas";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseUrl.trim() !== "" &&
      !supabaseUrl.includes("placeholder") &&
      supabaseAnonKey &&
      supabaseAnonKey.trim() !== "" &&
      !supabaseAnonKey.includes("placeholder")
  );
};

export const supabase: SupabaseClient = createClient(
  supabaseUrl && supabaseUrl.trim() !== ""
    ? supabaseUrl
    : "https://placeholder.supabase.co",
  supabaseAnonKey && supabaseAnonKey.trim() !== ""
    ? supabaseAnonKey
    : "placeholder-anon-key"
);

/**
 * Graceful persistence helper for statements.
 * Silently skips if Supabase is unconfigured, preventing crashes.
 */
export async function persistStatementSafe(
  statement: StatementRecord
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from("statements").insert([
      {
        id: statement.id,
        case_id: statement.case_id,
        narrator: statement.narrator,
        body: statement.body,
        statement_date: statement.statement_date,
        prev_hash: statement.prev_hash,
        hash: statement.hash,
        created_at: statement.created_at || new Date().toISOString(),
      },
    ]);
    if (error) {
      console.warn("Supabase statement insert warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase persistence caught error:", err);
    return false;
  }
}

/**
 * Graceful persistence helper for extracted claims.
 */
export async function persistClaimsSafe(
  claims: ExtractedClaim[],
  statementId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || claims.length === 0) return false;
  try {
    const records = claims.map((c) => ({
      statement_id: statementId,
      source_quote: c.source_quote,
      who: c.who,
      what: c.what,
      place: c.place,
      time_start: c.time_start,
      time_end: c.time_end,
      status: c.status,
      unknown_slots: c.unknown_slots,
    }));
    const { error } = await supabase.from("claims").insert(records);
    if (error) {
      console.warn("Supabase claims insert warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase claims caught error:", err);
    return false;
  }
}
