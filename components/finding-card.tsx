"use client";

import React from "react";
import {
  AlertTriangle,
  Clock,
  MapPin,
  Split,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { Finding } from "@/agent/schemas";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/i18n-context";
import { useDynamicTranslations } from "@/locales/dynamic-translation";
import type { TranslationKey } from "@/locales/translations";

interface FindingCardProps {
  finding: Finding;
  onStatusChange?: (id: string, status: string) => void;
}

const TYPE_LABELS: Record<Finding["type"], TranslationKey> = {
  location_conflict: "location_conflict",
  time_conflict: "time_conflict",
  timeline_gap: "timeline_gap",
  statement_dispute: "statement_dispute",
  internal_inconsistency: "internal_inconsistency",
};

const SEVERITY_LABELS: Record<Finding["type"], TranslationKey> = {
  location_conflict: "severity_critical",
  time_conflict: "severity_temporal",
  timeline_gap: "severity_unaccounted",
  statement_dispute: "severity_corroboration",
  internal_inconsistency: "severity_self",
};

export function FindingCard({ finding, onStatusChange }: FindingCardProps) {
  const { t, lang } = useI18n();
  const { translations } = useDynamicTranslations([finding.explanation]);

  const getFindingMeta = (type: Finding["type"]) => {
    switch (type) {
      case "location_conflict":
        return {
          icon: MapPin,
          color: "border-danger/30 bg-danger-light/50",
          badgeColor: "bg-danger-light text-danger border-danger/20",
        };
      case "time_conflict":
        return {
          icon: Clock,
          color: "border-warning/30 bg-warning-light/50",
          badgeColor: "bg-warning-light text-warning border-warning/20",
        };
      case "timeline_gap":
        return {
          icon: Split,
          color: "border-accent/30 bg-accent-muted",
          badgeColor: "bg-accent-muted text-accent border-accent-light",
        };
      case "statement_dispute":
        return {
          icon: ShieldAlert,
          color: "border-warning/30 bg-warning-light/50",
          badgeColor: "bg-warning-light text-warning border-warning/20",
        };
      case "internal_inconsistency":
      default:
        return {
          icon: AlertTriangle,
          color: "border-danger/30 bg-danger-light/50",
          badgeColor: "bg-danger-light text-danger border-danger/20",
        };
    }
  };

  const meta = getFindingMeta(finding.type);
  const Icon = meta.icon;

  const displayExplanation =
    lang !== "en" ? (translations[finding.explanation] ?? finding.explanation) : finding.explanation;

  return (
    <div className={cn("rounded-xl border p-4 transition-all duration-200 shadow-sm", meta.color)}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/60">
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold tracking-wide text-ink">
            {t(TYPE_LABELS[finding.type])}
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border",
            meta.badgeColor
          )}
        >
          {t(SEVERITY_LABELS[finding.type])}
        </span>
      </div>

      {/* Explanation (translated display; original preserved in state) */}
      <p className="text-sm leading-relaxed text-ink-secondary font-medium mb-3">
        {displayExplanation}
      </p>

      {/* Footer / Links */}
      <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-white/60">
        <div className="flex items-center gap-2 font-mono">
          {finding.claim_id && (
            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {t("claim_ref")}: {finding.claim_id}
            </span>
          )}
          {finding.evidence_id && (
            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {t("ref_label")}: {finding.evidence_id}
            </span>
          )}
        </div>

        {onStatusChange && (
          <button
            onClick={() =>
              onStatusChange(
                finding.id || "",
                finding.status === "resolved" ? "open" : "resolved"
              )
            }
            className="flex items-center gap-1 text-xs hover:text-ink transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3 text-success" />
            <span>
              {finding.status === "resolved" ? t("reopen") : t("acknowledge")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
