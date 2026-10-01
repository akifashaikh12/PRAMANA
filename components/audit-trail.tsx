"use client";

import React, { useCallback, useEffect, useState } from "react";
import { History, ShieldCheck, ShieldAlert, Copy, Check, Loader2 } from "lucide-react";
import { CaseAuditLog } from "@/agent/schemas";
import { useI18n } from "@/locales/i18n-context";
import { cn } from "@/lib/utils";

interface AuditTrailProps {
  caseId: string | null;
  /** Bump to re-fetch after a new audit entry is appended. */
  refreshKey?: number;
}

/**
 * Immutable audit log viewer for the active case. Entries arrive from
 * /api/cases/[id]/audit with a server-verified sha256 chain; the component
 * renders them read-only (the table itself is append-only in Supabase).
 */
export function AuditTrail({ caseId, refreshKey = 0 }: AuditTrailProps) {
  const { t } = useI18n();
  const [logs, setLogs] = useState<CaseAuditLog[]>([]);
  const [valid, setValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/audit`);
      const json = await res.json();
      setLogs(json.logs ?? []);
      setValid(json.verification?.valid ?? null);
    } catch {
      setLogs([]);
      setValid(null);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    // rAF defers the fetch/setState out of the effect body (React Compiler-safe)
    const frame = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(frame);
  }, [load, refreshKey]);

  const handleCopy = (log: CaseAuditLog) => {
    // Copy the VERBATIM entry (states + hash), never a localized variant
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedKey(log.id ?? log.sha256_hash);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const truncateHash = (hash: string) =>
    hash && hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : hash;

  if (!caseId) return null;

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold text-ink uppercase tracking-wide">
            {t("audit_title")}
          </h3>
        </div>
        {valid === null ? null : valid ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success-light border border-success/20 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            {t("hash_valid")}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-semibold text-danger bg-danger-light border border-danger/20 px-2 py-0.5 rounded-full">
            <ShieldAlert className="w-3 h-3" />
            {t("hash_tampered")}
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">{t("audit_empty")}</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id ?? log.sha256_hash}
              className={cn(
                "p-2 rounded-lg border text-xs space-y-1 group",
                valid === false
                  ? "bg-danger-light border-danger/30"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono font-bold text-accent uppercase">
                  {log.action_type}
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-muted" title={log.sha256_hash}>
                    {truncateHash(log.sha256_hash)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(log)}
                    className="p-0.5 rounded text-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title={t("copy")}
                  >
                    {copiedKey === (log.id ?? log.sha256_hash) ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>{log.changed_by}</span>
                <span className="font-mono">
                  {new Date(log.timestamp).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
