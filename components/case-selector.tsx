"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Plus,
  Pencil,
  Check,
  X,
  Loader2,
  History,
  Database,
} from "lucide-react";
import { CaseMeta } from "@/agent/schemas";
import { useI18n } from "@/locales/i18n-context";
import { cn } from "@/lib/utils";

type Mode = "diary" | "investigation" | "hiring";

interface CaseSelectorProps {
  /** Currently open case id (workspace) or null (landing page). */
  activeCaseId?: string | null;
  /** Active case title when known (enables inline rename in workspace). */
  activeCaseTitle?: string | null;
  /** Mode used when creating a new case from the landing selector. */
  createMode?: Mode;
  /** Called after a case is created or renamed so parents can refresh state. */
  onCaseChanged?: (updated: CaseMeta | null) => void;
  /** Compact rendering for the workspace toolbar row. */
  compact?: boolean;
}

/**
 * Case / Session selector: pick a persisted case, create a new one, or rename
 * the active case. Every mutation flows through /api/cases which bumps
 * `version`, refreshes `updated_at`, and appends a hash-chained audit entry —
 * the component itself never writes to Supabase directly.
 */
export function CaseSelector({
  activeCaseId = null,
  activeCaseTitle = null,
  createMode = "investigation",
  onCaseChanged,
  compact = false,
}: CaseSelectorProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [cases, setCases] = useState<CaseMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cases");
      const json = await res.json();
      setCases(json.cases ?? []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // rAF defers the fetch/setState out of the effect body (React Compiler-safe)
    const frame = requestAnimationFrame(() => {
      void refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, [refresh]);

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.focus();
  }, [isRenaming]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t("untitled_case_prefix") + " " + new Date().toLocaleDateString(),
          mode: createMode,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Create failed");
      await refresh();
      onCaseChanged?.(json.case as CaseMeta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRenameSubmit = async () => {
    const title = renameValue.trim();
    if (!title || !activeCaseId) return;
    setError(null);
    try {
      const res = await fetch(`/api/cases/${activeCaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Rename failed");
      setIsRenaming(false);
      await refresh();
      onCaseChanged?.(json.case as CaseMeta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const activeCase = cases.find((c) => c.id === activeCaseId) ?? null;

  return (
    <div className={cn("flex items-center gap-2", compact ? "" : "flex-wrap")}>
      <div className="flex items-center gap-1.5 text-xs text-muted shrink-0">
        <FolderOpen className="w-3.5 h-3.5 text-accent" />
        <span className="hidden md:inline">{t("case_selector_title")}</span>
      </div>

      {/* Persisted case list (only meaningful when Supabase is configured) */}
      {cases.length > 0 && (
        <select
          value={activeCaseId ?? ""}
          onChange={(e) => {
            const picked = cases.find((c) => c.id === e.target.value);
            if (picked) {
              router.push(`/case/${picked.id}`);
            }
          }}
          className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 max-w-[220px] cursor-pointer"
          title={t("case_selector_title")}
        >
          <option value="" disabled>
            {t("case_selector_title")}
          </option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} (v{c.version})
            </option>
          ))}
        </select>
      )}

      {/* Rename control (workspace only, requires a persisted active case) */}
      {activeCaseId && activeCaseTitle && (
        isRenaming ? (
          <div className="flex items-center gap-1">
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleRenameSubmit();
                if (e.key === "Escape") setIsRenaming(false);
              }}
              maxLength={200}
              className="h-8 w-48 px-2 bg-white border border-accent/40 rounded-lg text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <button
              type="button"
              onClick={() => void handleRenameSubmit()}
              className="p-1.5 rounded-lg bg-success-light text-success border border-success/20 hover:bg-success/10 transition-colors cursor-pointer"
              title={t("save_record")}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsRenaming(false)}
              className="p-1.5 rounded-lg bg-slate-100 text-muted border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              title={t("cancel")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRenameValue(activeCaseTitle);
              setIsRenaming(true);
            }}
            className="p-2 rounded-lg bg-white border border-slate-200 text-muted hover:text-accent hover:border-accent/40 transition-colors cursor-pointer"
            title={t("rename_case")}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )
      )}

      {/* Create new case */}
      <button
        type="button"
        onClick={() => void handleCreate()}
        disabled={creating}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold bg-white hover:bg-slate-50 text-ink border-slate-200 hover:border-accent/40 transition-all shadow-sm cursor-pointer disabled:opacity-60"
        title={t("create_session")}
      >
        {creating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
        ) : (
          <Plus className="w-3.5 h-3.5 text-accent" />
        )}
        <span>{t("new_case")}</span>
      </button>

      {/* Persistence status hint */}
      {!compact && cases.length === 0 && !loading && (
        <span className="flex items-center gap-1.5 text-xs text-muted" title={t("persistence_hint")}>
          <Database className="w-3 h-3" />
          <span className="hidden lg:inline">{t("persistence_hint")}</span>
        </span>
      )}

      {loading && cases.length === 0 && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted" />
      )}

      {error && (
        <span className="text-xs text-danger bg-danger-light border border-danger/20 px-2 py-1 rounded-lg max-w-[320px] truncate" title={error}>
          {error}
        </span>
      )}

      {/* Active case version badge */}
      {activeCase && (
        <span
          className="flex items-center gap-1 text-xs text-muted"
          title={t("audit_title")}
        >
          <History className="w-3 h-3 text-success" />
          v{activeCase.version} • {new Date(activeCase.updated_at).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
