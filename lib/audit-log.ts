import { createHash } from "crypto";
import type { CaseAuditLog } from "@/agent/schemas";

/**
 * Deterministic SHA-256 for an audit-log row.
 * Hash covers the FULL chain context: previous log hash (per case) +
 * action + actor + previous/new state + timestamp. This makes the audit
 * trail itself tamper-evident — modifying any historical row breaks every
 * subsequent hash, exactly like the statement hash chain.
 */
export function computeAuditLogHash(input: {
  prevHash: string | null;
  actionType: string;
  changedBy: string;
  previousState: unknown;
  newState: unknown;
  timestamp: string;
}): string {
  const canonical = JSON.stringify({
    prev: input.prevHash ?? "GENESIS",
    action: input.actionType,
    by: input.changedBy,
    previous: input.previousState ?? null,
    new: input.newState ?? null,
    at: input.timestamp,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/** Public shape for verifying an existing chain of audit logs (oldest first). */
export function verifyAuditLogChain(logs: CaseAuditLog[]): {
  valid: boolean;
  verifiedCount: number;
  brokenAtIndex: number | null;
} {
  const ordered = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let prevHash: string | null = null;
  for (let i = 0; i < ordered.length; i++) {
    const log = ordered[i];
    const expected = computeAuditLogHash({
      prevHash,
      actionType: log.action_type,
      changedBy: log.changed_by,
      previousState: log.previous_state,
      newState: log.new_state,
      timestamp: log.timestamp,
    });
    if (expected !== log.sha256_hash) {
      return { valid: false, verifiedCount: i, brokenAtIndex: i };
    }
    prevHash = log.sha256_hash;
  }

  return { valid: true, verifiedCount: ordered.length, brokenAtIndex: null };
}
