"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Briefcase,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  GitBranch,
  Lock,
  Plus,
  FolderOpen,
} from "lucide-react";
import { Header } from "@/components/header";
import { useI18n } from "@/locales/i18n-context";
import type { TranslationKey } from "@/locales/translations";
import { cn } from "@/lib/utils";

type ModeId = "investigation" | "hiring" | "diary";

interface PresetCase {
  id: ModeId;
  caseId: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  descKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey: TranslationKey;
  emoji: string;
}

const MODE_ORDER: ModeId[] = ["diary", "hiring", "investigation"];

const MODE_TABS: Record<ModeId, { emoji: string; labelKey: TranslationKey; icon: React.ComponentType<{ className?: string }> }> = {
  diary: { emoji: "📔", labelKey: "mode_diary", icon: BookOpen },
  hiring: { emoji: "💼", labelKey: "mode_hiring", icon: Briefcase },
  investigation: { emoji: "🔍", labelKey: "mode_investigation", icon: ShieldAlert },
};

const PRESET_CASES: PresetCase[] = [
  {
    id: "investigation",
    caseId: "meridian-intrusion",
    titleKey: "investigation_title",
    subtitleKey: "investigation_subtitle",
    descKey: "investigation_desc",
    icon: ShieldAlert,
    badgeKey: "minute_precision",
    emoji: "🔍",
  },
  {
    id: "hiring",
    caseId: "principal-architect-hiring",
    titleKey: "hiring_title",
    subtitleKey: "hiring_subtitle",
    descKey: "hiring_desc",
    icon: Briefcase,
    badgeKey: "day_precision",
    emoji: "💼",
  },
  {
    id: "diary",
    caseId: "1994-lake-trip-diary",
    titleKey: "diary_title",
    subtitleKey: "diary_subtitle",
    descKey: "diary_desc",
    icon: BookOpen,
    badgeKey: "hour_precision",
    emoji: "📔",
  },
];

const features: {
  icon: React.ComponentType<{ className?: string }>;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  formula?: boolean;
  iconClass: string;
}[] = [
  {
    icon: ShieldCheck,
    titleKey: "feature_hash_title",
    descKey: "feature_hash_desc",
    formula: true,
    iconClass: "text-success bg-success-light",
  },
  {
    icon: GitBranch,
    titleKey: "feature_graph_title",
    descKey: "feature_graph_desc",
    iconClass: "text-accent bg-accent-light",
  },
  {
    icon: Layers,
    titleKey: "feature_audit_title",
    descKey: "feature_audit_desc",
    iconClass: "text-success bg-success-light",
  },
  {
    icon: Sparkles,
    titleKey: "feature_linter_title",
    descKey: "feature_linter_desc",
    iconClass: "text-accent bg-accent-light",
  },
];

export default function HomePage() {
  const { t } = useI18n();
  const [activeMode, setActiveMode] = useState<ModeId>("investigation");

  const preset = PRESET_CASES.find((c) => c.id === activeMode) ?? PRESET_CASES[0];
  const PresetIcon = preset.icon;
  const TabIcon = MODE_TABS[activeMode].icon;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-12 flex flex-col gap-10">
        {/* STEP 1: HERO — branding, slogan & value proposition */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-muted border border-accent-light text-accent text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("hero_slogan")}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink">
            {t("app_name")}
          </h1>

          <p className="text-base text-muted leading-relaxed max-w-2xl mx-auto">
            {t("hero_value_prop")}
          </p>
        </section>

        {/* STEP 2: GLOBAL MODE SELECTOR TABS */}
        <section className="space-y-4">
          <h2 className="text-h2 font-bold text-ink">{t("modes_title")}</h2>
          <div
            role="tablist"
            aria-label={t("modes_title")}
            className="inline-flex w-full sm:w-auto p-1 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            {MODE_ORDER.map((modeId) => {
              const tab = MODE_TABS[modeId];
              const isActive = activeMode === modeId;
              return (
                <button
                  key={modeId}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveMode(modeId)}
                  className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-accent text-white shadow-sm"
                      : "text-ink-secondary hover:text-ink hover:bg-slate-50"
                  )}
                >
                  <span aria-hidden>{tab.emoji}</span>
                  <span>{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* STEP 3: CASE / SESSION SELECTOR */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-accent" />
            <h2 className="text-h2 font-bold text-ink">{t("case_selector_title")}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preset scenario card for the active mode */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-lg bg-accent-muted text-accent border border-accent-light">
                    <PresetIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-muted bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                    {t("preset_badge")} • {t(preset.badgeKey)}
                  </span>
                </div>

                <div>
                  <h3 className="text-h3 font-bold text-ink tracking-tight">
                    <span aria-hidden className="mr-1">{preset.emoji}</span>
                    {t(preset.titleKey)}
                  </h3>
                  <p className="text-sm text-accent font-medium mt-1">
                    {t(preset.subtitleKey)}
                  </p>
                </div>

                <p className="text-sm text-ink-secondary leading-relaxed">
                  {t(preset.descKey)}
                </p>
              </div>

              <div className="pt-6">
                <Link
                  href={`/case/${preset.caseId}`}
                  className="btn-primary w-full justify-center py-2"
                >
                  <span>{t("load_preset")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* New blank session card */}
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 flex flex-col justify-between hover:border-accent/40 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-lg bg-slate-100 text-ink-secondary border border-slate-200">
                    <TabIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-muted bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                    {t("blank_session_badge")}
                  </span>
                </div>

                <div>
                  <h3 className="text-h3 font-bold text-ink tracking-tight">
                    {t("new_case")} — {t(MODE_TABS[activeMode].labelKey)}
                  </h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    {t("new_case_desc")}
                  </p>
                </div>

                <ul className="space-y-1.5 text-xs text-muted">
                  <li className="flex items-center gap-1.5">
                    <span aria-hidden>{MODE_TABS[activeMode].emoji}</span>
                    {t(`domain_${activeMode}` as TranslationKey)}
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link href="/case/new" className="btn-secondary w-full justify-center py-2">
                  <Plus className="w-4 h-4" />
                  <span>{t("create_session")}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture highlights */}
        <section className="space-y-4">
          <h2 className="text-h2 font-bold text-ink">{t("features_title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.titleKey}
                  className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", feature.iconClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-ink">{t(feature.titleKey)}</h3>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    {t(feature.descKey)}
                    {feature.formula && (
                      <>
                        {" "}
                        <code className="text-[10px] font-mono bg-slate-50 border border-slate-200 px-1 py-0.5 rounded text-accent">
                          {t("feature_hash_formula")}
                        </code>
                        {t("feature_hash_tail")}
                      </>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-muted bg-white">
        <p>{t("footer_text")}</p>
        <p className="mt-2 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-success" />
          {t("hash_chain_badge")} • <Cpu className="w-3 h-3 text-accent" /> {t("langgraph_badge")}
        </p>
      </footer>
    </div>
  );
}
