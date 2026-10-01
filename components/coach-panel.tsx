"use client";

import React, { useMemo, useState } from "react";
import { Sparkles, ShieldCheck, Copy, Check, Target, Compass } from "lucide-react";
import { CoachQuestion } from "@/agent/schemas";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/i18n-context";
import { useTranslatedPayload } from "@/locales/translated-payload";
import type { TranslationKey } from "@/locales/translations";

interface CoachPanelProps {
  coachQuestion: CoachQuestion | null;
  onUseQuestion?: (question: string) => void;
}

export function CoachPanel({ coachQuestion, onUseQuestion }: CoachPanelProps) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);

  // 100% coverage: translate the WHOLE coach payload (question, rationale,
  // missing-slot label) in one request when the language changes. Display-only
  // — copy/use always emit the verbatim original (SHA-256 audit chain intact).
  const coachData = useMemo(
    () =>
      coachQuestion
        ? {
            question: coachQuestion.question,
            reason: coachQuestion.reason,
            targetSlot: coachQuestion.target_slot ?? null,
          }
        : null,
    [coachQuestion]
  );
  const { data: translatedCoach } = useTranslatedPayload(coachData, lang);

  const SLOT_LABEL_KEYS: Record<string, TranslationKey> = {
    who: "slot_who",
    what: "slot_what",
    place: "slot_place",
    time_start: "slot_time",
    time_end: "slot_time",
  };
  const slotLabel =
    translatedCoach?.targetSlot != null
      ? (SLOT_LABEL_KEYS[translatedCoach.targetSlot]
          ? t(SLOT_LABEL_KEYS[translatedCoach.targetSlot])
          : translatedCoach.targetSlot)
      : coachQuestion?.target_slot ?? null;

  if (!coachQuestion) {
    return (
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 text-center space-y-2">
        <Compass className="w-6 h-6 text-muted mx-auto" />
        <h4 className="text-sm font-semibold text-ink">{t("coach_idle_title")}</h4>
        <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
          {t("coach_idle_desc")}
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    // Copy the VERBATIM original question, never the translation
    navigator.clipboard.writeText(coachQuestion.question);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityStyle = (priority: CoachQuestion["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-danger-light border-danger/20 text-danger";
      case "medium":
        return "bg-warning-light border-warning/20 text-warning";
      case "low":
      default:
        return "bg-accent-muted border-accent-light text-accent";
    }
  };

  const priorityLabel: Record<CoachQuestion["priority"], Parameters<typeof t>[0]> = {
    high: "priority_high",
    medium: "priority_medium",
    low: "priority_low",
  };

  const displayQuestion = translatedCoach?.question ?? coachQuestion.question;
  const displayReason = translatedCoach?.reason ?? coachQuestion.reason;

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent-muted text-accent border border-accent-light">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wide">
              {t("coach_title")}
            </h3>
            <span className="text-xs text-accent font-medium">{t("coach_subtitle")}</span>
          </div>
        </div>

        <span
          className={cn(
            "text-xs font-mono uppercase px-2 py-0.5 rounded-full font-bold border",
            getPriorityStyle(coachQuestion.priority)
          )}
        >
          {t(priorityLabel[coachQuestion.priority])}
        </span>
      </div>

      {/* Main Question Quote Box */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg relative">
        <p className="text-base font-semibold text-ink leading-relaxed">&ldquo;{displayQuestion}&rdquo;</p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-1 text-success font-medium">
            <ShieldCheck className="w-3 h-3" />
            <span>{t("non_leading_passed")}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1 text-muted hover:text-ink transition-colors rounded hover:bg-slate-100 cursor-pointer"
              title={t("copy")}
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            {onUseQuestion && (
              <button
                onClick={() => onUseQuestion(coachQuestion.question)}
                className="text-xs text-accent bg-accent-muted hover:bg-accent-light border border-accent-light px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {t("use_inquiry")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Strategic Rationale */}
      <div className="space-y-1">
        <div className="text-xs uppercase font-bold text-muted tracking-wide flex items-center gap-1">
          <Target className="w-3 h-3" />
          <span>{t("reason_label")}</span>
        </div>
        <p className="text-sm text-ink-secondary leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-200">
          {displayReason}
        </p>
      </div>

      {/* Target Slot Tag */}
      {slotLabel && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{t("target_slot")}</span>
          <span className="font-mono uppercase bg-slate-100 text-accent px-1.5 py-0.5 rounded font-bold border border-slate-200">
            {slotLabel}
          </span>
        </div>
      )}
    </div>
  );
}
