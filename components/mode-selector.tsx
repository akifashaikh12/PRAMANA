"use client";

import React from "react";
import { ShieldAlert, Briefcase, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/i18n-context";
import type { TranslationKey } from "@/locales/translations";

export type ModeType = "investigation" | "hiring" | "diary";

interface ModeSelectorProps {
  currentMode: ModeType;
  onModeChange: (mode: ModeType) => void;
  disabled?: boolean;
}

const MODES: {
  id: ModeType;
  labelKey: TranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  taglineKey: TranslationKey;
  precisionKey: TranslationKey;
}[] = [
  {
    id: "investigation",
    labelKey: "mode_investigation",
    icon: ShieldAlert,
    taglineKey: "investigation_tagline",
    precisionKey: "minute_precision",
  },
  {
    id: "hiring",
    labelKey: "mode_hiring",
    icon: Briefcase,
    taglineKey: "hiring_tagline",
    precisionKey: "day_precision",
  },
  {
    id: "diary",
    labelKey: "mode_diary",
    icon: BookOpen,
    taglineKey: "diary_tagline",
    precisionKey: "hour_precision",
  },
];

export function ModeSelector({
  currentMode,
  onModeChange,
  disabled = false,
}: ModeSelectorProps) {
  const { t } = useI18n();
  const activeModeData = MODES.find((m) => m.id === currentMode) ?? MODES[0];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Pill tabs — active tab uses the 10% Electric Royal Blue accent */}
      <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-ink-secondary hover:text-ink hover:bg-white"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t(m.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Mode metadata badge */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-muted bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm">
        <Clock className="w-3 h-3 text-accent" />
        <span className="text-ink font-semibold">{t(activeModeData.precisionKey)}</span>
        <span className="text-slate-300">•</span>
        <span>{t(activeModeData.taglineKey)}</span>
      </div>
    </div>
  );
}
