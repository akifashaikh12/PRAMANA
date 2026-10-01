import {
  CaseMeta,
  CaseAuditLog,
} from "@/agent/schemas";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { computeAuditLogHash } from "@/lib/audit-log";

/**
 * Case Management service: metadata CRUD + immutable, hash-chained audit logs.
 *
 * Every helper degrades gracefully to local/no-op behaviour when Supabase is
 * unconfigured so the app never crashes without env vars. IMPORTANT: none of
 * these functions ever mutate stored statement/claim text — the SHA-256
 * statement hash chain stays valid regardless of case editing.
 */

export type AuditActionType =
  | "CASE_CREATED"
  | "CASE_UPDATED"
  | "STATEMENT_ADDED"
  | "EVIDENCE_MODIFIED"
  | "CLAIM_DELETED";

export interface CreateCaseInput {
  title: string;
  mode: "diary" | "investigation" | "hiring";
  changedBy?: string;
}

export interface UpdateCaseInput {
  title?: string;
  mode?: "diary" | "investigation" | "hiring";
  changedBy?: string;
}

/** Create a case (version 1) + its genesis CASE_CREATED audit entry. */
export async function createCaseSafe(
  input: CreateCaseInput
): Promise<CaseMeta | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("cases")
      .insert({ title: input.title, mode: input.mode, created_at: now, updated_at: now, version: 1 })
      .select()
      .single();

    if (error || !data) {
      console.warn("createCaseSafe warning:", error?.message);
      return null;
    }

    const created = data as CaseMeta;
    await appendAuditLogSafe({
      caseId: created.id,
      actionType: "CASE_CREATED",
      changedBy: input.changedBy ?? "system_user",
      previousState: null,
      newState: { title: created.title, mode: created.mode, version: 1 },
    });
    return created;
  } catch (err) {
    console.warn("createCaseSafe caught error:", err);
    return null;
  }
}

/** List cases newest-updated first. */
export async function listCasesSafe(): Promise<CaseMeta[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("listCasesSafe warning:", error.message);
      return [];
    }
    return (data ?? []) as CaseMeta[];
  } catch (err) {
    console.warn("listCasesSafe caught error:", err);
    return [];
  }
}

/** Fetch a single case by id. */
export async function getCaseSafe(id: string): Promise<CaseMeta | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.warn("getCaseSafe warning:", error.message);
      return null;
    }
    return (data as CaseMeta) ?? null;
  } catch (err) {
    console.warn("getCaseSafe caught error:", err);
    return null;
  }
}

/**
 * Update case metadata. Bumps `version`, refreshes `updated_at`, and writes a
 * CASE_UPDATED audit row containing the previous vs new state. `title`/`mode`
 * are the ONLY editable fields — audit-protected statement data is untouched.
 */
export async function updateCaseSafe(
  id: string,
  patch: UpdateCaseInput
): Promise<CaseMeta | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const previous = await getCaseSafe(id);
    if (!previous) return null;

    const nextVersion = previous.version + 1;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("cases")
      .update({
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.mode !== undefined ? { mode: patch.mode } : {}),
        updated_at: now,
        version: nextVersion,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.warn("updateCaseSafe warning:", error?.message);
      return null;
    }

    await appendAuditLogSafe({
      caseId: id,
      actionType: "CASE_UPDATED",
      changedBy: patch.changedBy ?? "system_user",
      previousState: { title: previous.title, mode: previous.mode, version: previous.version },
      newState: { title: data.title, mode: data.mode, version: data.version },
    });

    return data as CaseMeta;
  } catch (err) {
    console.warn("updateCaseSafe caught error:", err);
    return null;
  }
}

/**
 * Append one hash-chained audit row. The row hash covers the previous log
 * hash for the case (fetched server-side), action, actor, states, timestamp —
 * making the log tamper-evident and effectively immutable in practice.
 */
export async function appendAuditLogSafe(input: {
  caseId: string | null;
  actionType: AuditActionType;
  changedBy?: string;
  previousState?: unknown;
  newState?: unknown;
}): Promise<CaseAuditLog | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const timestamp = new Date().toISOString();
    const changedBy = input.changedBy ?? "system_user";

    // Chain to the case's most recent audit entry (null = genesis)
    let prevHash: string | null = null;
    if (input.caseId) {
      const { data: last } = await supabase
        .from("case_audit_logs")
        .select("sha256_hash, timestamp")
        .eq("case_id", input.caseId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();
      prevHash = (last as { sha256_hash?: string } | null)?.sha256_hash ?? null;
    }

    const sha256Hash = computeAuditLogHash({
      prevHash,
      actionType: input.actionType,
      changedBy,
      previousState: input.previousState ?? null,
      newState: input.newState ?? null,
      timestamp,
    });

    const { data, error } = await supabase
      .from("case_audit_logs")
      .insert({
        case_id: input.caseId,
        action_type: input.actionType,
        changed_by: changedBy,
        previous_state: input.previousState ?? null,
        new_state: input.newState ?? null,
        timestamp,
        sha256_hash: sha256Hash,
      })
      .select()
      .single();

    if (error || !data) {
      console.warn("appendAuditLogSafe warning:", error?.message);
      return null;
    }
    return data as CaseAuditLog;
  } catch (err) {
    console.warn("appendAuditLogSafe caught error:", err);
    return null;
  }
}

/** Fetch a case's audit trail, oldest first. */
export async function listAuditLogsSafe(caseId: string): Promise<CaseAuditLog[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from("case_audit_logs")
      .select("*")
      .eq("case_id", caseId)
      .order("timestamp", { ascending: true })
      .limit(200);

    if (error) {
      console.warn("listAuditLogsSafe warning:", error.message);
      return [];
    }
    return (data ?? []) as CaseAuditLog[];
  } catch (err) {
    console.warn("listAuditLogsSafe caught error:", err);
    return [];
  }
}
