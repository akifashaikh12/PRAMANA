"use client";

import React, { useState } from "react";
import { ArrowRight, ShieldQuestion, Loader2 } from "lucide-react";
import { UnresolvedSlot } from "@/agent/state";
import { useI18n } from "@/locales/i18n-context";
import { useDynamicTranslations } from "@/locales/dynamic-translation";
import { useMemo } from "react";

interface ClarificationGateProps {
  unresolvedSlots: UnresolvedSlot[];
  clarificationQuestion: string | null;
  onResolve: (answer: string, slot: string) => Promise<void>;
  isLoading?: boolean;
}

export function ClarificationGate({
  unresolvedSlots,
  clarificationQuestion,
  onResolve,
  isLoading = false,
}: ClarificationGateProps) {
  const { t } = useI18n();
  const [answer, setAnswer] = useState("");
  const currentSlot = unresolvedSlots[0];

  // 100% language enforcement: the verbatim claim quote and the LLM-generated
  // clarification question render in the active language (display-only).
  const dynamicTexts = useMemo(
    () =>
      [
        currentSlot?.claimQuote,
        clarificationQuestion,
      ].filter((s): s is string => Boolean(s && s.trim())),
    [currentSlot?.claimQuote, clarificationQuestion]
  );
  const { translations } = useDynamicTranslations(dynamicTexts);

  if (!currentSlot && !clarificationQuestion) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isLoading) return;
    await onResolve(answer.trim(), currentSlot?.slot || "clarification");
    setAnswer("");
  };

  const handleQuickAnswer = (text: string) => {
    setAnswer(text);
  };

  return (
    <div className="bg-warning-light border border-warning/30 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-warning/20">
        <div className="flex items-center gap-2 text-warning font-semibold text-xs tracking-wide">
          <ShieldQuestion className="w-4 h-4" />
          <span>{t("clarification_gate")}</span>
        </div>
        {currentSlot && (
          <span className="text-xs font-mono uppercase bg-white text-warning border border-warning/30 px-2 py-0.5 rounded-full font-bold">
            {currentSlot.slot}
          </span>
        )}
      </div>

      {/* Target Claim Quote & Question */}
      <div className="space-y-2">
        {currentSlot?.claimQuote && (
          <p className="text-xs text-muted italic bg-white p-2 rounded-lg border border-slate-200">
            {t("clarification_anchor")} &ldquo;{translations[currentSlot.claimQuote] ?? currentSlot.claimQuote}&rdquo;
          </p>
        )}
        <div className="p-3 bg-white border border-warning/30 rounded-lg">
          <p className="text-sm font-medium text-ink leading-relaxed">
            {(clarificationQuestion && (translations[clarificationQuestion] ?? clarificationQuestion)) ||
              t("clarification_fallback")}
          </p>
        </div>
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t("clarification_placeholder")}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
          />
          <button
            type="submit"
            disabled={!answer.trim() || isLoading}
            className="btn-primary h-9 disabled:bg-slate-100 disabled:text-muted"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{t("resolve")}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{t("quick_fill")}</span>
          <button
            type="button"
            onClick={() => handleQuickAnswer("Basement Vault Entrance at 14:02")}
            className="text-accent hover:underline decoration-dotted cursor-pointer"
          >
            &ldquo;{t("quick_fill_time")}&rdquo;
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleQuickAnswer("North Wing Conference Room")}
            className="text-accent hover:underline decoration-dotted cursor-pointer"
          >
            &ldquo;{t("quick_fill_place")}&rdquo;
          </button>
        </div>
      </form>
    </div>
  );
}
