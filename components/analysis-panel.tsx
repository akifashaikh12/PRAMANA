"use client";

import React, { useMemo, useState } from "react";
import {
  Gavel,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { Finding } from "@/agent/schemas";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/i18n-context";
import { useTranslatedPayload } from "@/locales/translated-payload";

interface AnalysisPanelProps {
  decisions: string[];
  findings: Finding[];
  coachQuestionText: string | null;
}

type SectionKey = "decisions" | "conflicts" | "questions";

/**
 * Column 3 synthesis: Decisions Made (verified facts), Conflicts Detected
 * (contradictory dates/places/actors) and Resolving Questions (next-best
 * questions). Dynamic strings are translated for DISPLAY only — the copy
 * buttons always emit the verbatim original so audit hashes stay valid.
 */
export function AnalysisPanel({
  decisions,
  findings,
  coachQuestionText,
}: AnalysisPanelProps) {
  const { t, lang } = useI18n();
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    decisions: true,
    conflicts: true,
    questions: true,
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const openConflicts = useMemo(
    () => findings.filter((f) => f.status !== "resolved"),
    [findings]
  );

  // Batch-translate the ENTIRE conflict-engine payload (decisions, conflict
  // explanations, resolving question) in one request whenever the language
  // changes. Display-only: stored originals are never mutated, so the
  // SHA-256 audit chain stays valid. Falls back to originals on failure.
  const conflictPayload = useMemo(
    () => ({
      decisions,
      conflicts: openConflicts.map((f) => ({ id: f.id, explanation: f.explanation })),
      question: coachQuestionText,
    }),
    [decisions, openConflicts, coachQuestionText]
  );
  const { data: translated } = useTranslatedPayload(conflictPayload, lang);

  const handleCopy = (key: string, original: string) => {
    // ALWAYS copy the verbatim original — never the translation
    navigator.clipboard.writeText(original);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggle = (key: SectionKey) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const decisionTone = (decision: string): string => {
    if (decision.startsWith("Verified:")) return "text-success";
    if (decision.startsWith("Disputed:")) return "text-danger";
    if (decision.startsWith("Pending:")) return "text-warning";
    return "text-ink-secondary";
  };

  const sections: {
    key: SectionKey;
    title: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
  }[] = [
    {
      key: "decisions",
      title: t("decisions_made"),
      count: decisions.length,
      icon: Gavel,
      tone: "text-success bg-success-light border-success/20",
    },
    {
      key: "conflicts",
      title: t("conflicts_detected"),
      count: openConflicts.length,
      icon: AlertTriangle,
      tone: "text-danger bg-danger-light border-danger/20",
    },
    {
      key: "questions",
      title: t("resolving_questions"),
      count: coachQuestionText ? 1 : 0,
      icon: HelpCircle,
      tone: "text-accent bg-accent-muted border-accent-light",
    },
  ];

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-1">
      <div className="pb-2 mb-1 border-b border-slate-200">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wide">
          {t("analysis_title")}
        </h3>
      </div>

      {sections.map((section) => {
        const Icon = section.icon;
        const isOpen = expanded[section.key];
        return (
          <div key={section.key} className="rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(section.key)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "p-1 rounded border",
                    section.tone
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-ink">{section.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-muted bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  {section.count}
                </span>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted" />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 space-y-2 max-h-64 overflow-y-auto">
                {section.key === "decisions" &&
                  (decisions.length === 0 ? (
                    <p className="text-xs text-muted py-2">{t("no_decisions")}</p>
                  ) : (
                    decisions.map((d, i) => (
                      <div
                        key={`d-${i}`}
                        className="group flex items-start justify-between gap-2 text-xs leading-relaxed"
                      >
                        <p className={cn("font-medium", decisionTone(d))}>
                          {translated.decisions?.[i] ?? d}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopy(`d-${i}`, d)}
                          className="p-1 rounded text-muted hover:text-ink hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                          title={t("copy")}
                        >
                          {copiedKey === `d-${i}` ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))
                  ))}

                {section.key === "conflicts" &&
                  (openConflicts.length === 0 ? (
                    <p className="text-xs text-muted py-2">{t("no_conflicts")}</p>
                  ) : (
                    openConflicts.map((f) => {
                      const translatedExplanation =
                        translated.conflicts?.find((c) => c.id === f.id)?.explanation ?? f.explanation;
                      return (
                      <div
                        key={f.id || f.explanation}
                        className="group flex items-start justify-between gap-2 text-xs leading-relaxed"
                      >
                        <p className="text-ink-secondary font-medium">{translatedExplanation}</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(f.id || f.explanation, f.explanation)}
                          className="p-1 rounded text-muted hover:text-ink hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                          title={t("copy")}
                        >
                          {copiedKey === (f.id || f.explanation) ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      );
                    })
                  ))}

                {section.key === "questions" &&
                  (coachQuestionText ? (
                    <div className="group flex items-start justify-between gap-2 text-xs leading-relaxed">
                      <p className="text-ink font-semibold italic">
                        &ldquo;{translated.question ?? coachQuestionText}&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopy("q", coachQuestionText)}
                        className="p-1 rounded text-muted hover:text-ink hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                        title={t("copy")}
                      >
                        {copiedKey === "q" ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted py-2">{t("no_questions")}</p>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
