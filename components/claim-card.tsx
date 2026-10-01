"use client";

import React, { useMemo } from "react";
import { User, MapPin, Clock, Quote, AlertTriangle, CheckCircle, ShieldAlert, Trash2 } from "lucide-react";
import { ExtractedClaim } from "@/agent/schemas";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/i18n-context";
import { useTranslatedPayload } from "@/locales/translated-payload";

interface ClaimCardProps {
  claim: ExtractedClaim;
  index: number;
  highlighted?: boolean;
  /** Sensitive modification: removes the claim (audit-logged by parent). */
  onClaimDelete?: (claim: ExtractedClaim) => void;
}

export function ClaimCard({
  claim,
  index,
  highlighted = false,
  onClaimDelete,
}: ClaimCardProps) {
  const { t, lang } = useI18n();

  // 100% language enforcement: translate ALL claim attributes (what, verbatim
  // quote, who/where/when) in one object request per language. Display-only —
  // stored claim text is never mutated, keeping SHA-256 hashes valid.
  const claimPayload = useMemo(
    () => ({
      what: claim.what,
      quote: claim.source_quote,
      who: claim.who,
      where: claim.place,
      when: claim.time_expression,
    }),
    [claim]
  );
  const { data: trc } = useTranslatedPayload(claimPayload, lang);
  const tr = (s: string | null | undefined, key: keyof typeof claimPayload): string =>
    (trc?.[key] as string | null | undefined) ?? s ?? "";

  const getStatusBadge = (status: ExtractedClaim["status"]) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success-light border border-success/20 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            {t("verified")}
          </span>
        );
      case "disputed":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger bg-danger-light border border-danger/20 px-2 py-0.5 rounded-full">
            <ShieldAlert className="w-3 h-3" />
            {t("disputed")}
          </span>
        );
      case "needs_clarification":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning bg-warning-light border border-warning/20 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            {t("needs_clarification")}
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold text-muted bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            {t("pending")}
          </span>
        );
    }
  };

  const hasMissing = claim.unknown_slots && claim.unknown_slots.length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-200",
        highlighted
          ? "bg-danger-light/40 border-danger/30"
          : "bg-white border-slate-200 hover:border-slate-300"
      )}
    >
      {/* Top Bar: Claim Index, Action Description, Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono font-bold text-accent bg-accent-muted px-1.5 py-0.5 rounded">
            C-{index + 1}
          </span>
          <h4 className="text-sm font-semibold text-ink line-clamp-1">{tr(claim.what, "what")}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          {onClaimDelete && (
            <button
              type="button"
              onClick={() => onClaimDelete(claim)}
              className="p-1 rounded text-muted hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
              title={t("delete_claim")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div>{getStatusBadge(claim.status)}</div>
      </div>

      {/* Verbatim Source Quote (original text — never mutated) */}
      <div className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-ink-secondary text-sm italic mb-3">
        <Quote className="w-3 h-3 text-muted shrink-0 mt-1" />
        <span className="line-clamp-2">&ldquo;{tr(claim.source_quote, "quote")}&rdquo;</span>
      </div>

      {/* Semantic Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {/* WHO slot */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg border",
            claim.who
              ? "bg-slate-50 border-slate-200 text-ink-secondary"
              : "bg-warning-light border-warning/30 text-warning"
          )}
        >
          <User className="w-3 h-3 text-muted shrink-0" />
          <span className="truncate">
            {claim.who ? tr(claim.who, "who") : <span className="italic">{t("slot_who_ambiguous")}</span>}
          </span>
        </div>

        {/* WHERE / PLACE slot */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg border",
            claim.place
              ? "bg-slate-50 border-slate-200 text-ink-secondary"
              : "bg-warning-light border-warning/30 text-warning"
          )}
        >
          <MapPin className="w-3 h-3 text-muted shrink-0" />
          <span className="truncate">
            {claim.place ? tr(claim.place, "where") : <span className="italic">{t("slot_place_missing")}</span>}
          </span>
        </div>

        {/* WHEN / TIME slot */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg border",
            claim.time_start || claim.time_expression
              ? "bg-slate-50 border-slate-200 text-ink-secondary"
              : "bg-warning-light border-warning/30 text-warning"
          )}
        >
          <Clock className="w-3 h-3 text-muted shrink-0" />
          <span className="truncate" title={claim.time_start || claim.time_expression || ""}>
            {claim.time_expression
              ? tr(claim.time_expression, "when")
              : claim.time_start
                ? new Date(claim.time_start).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : t("slot_time_unanchored")}
          </span>
        </div>
      </div>

      {/* Missing Required Slots Alert */}
      {hasMissing && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
          <span className="text-warning flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3 h-3" /> {t("missing_required_slots")}
          </span>
          <div className="flex gap-1">
            {claim.unknown_slots.map((s) => (
              <span
                key={s}
                className="bg-warning-light border border-warning/30 text-warning px-1.5 py-0.5 rounded font-mono uppercase"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
