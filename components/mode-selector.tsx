"use client";

import React from "react";
import { ShieldAlert, Briefcase, BookOpen, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModeType = "investigation" | "hiring" | "diary";

interface ModeSelectorProps {
  currentMode: ModeType;
  onModeChange: (mode: ModeType) => void;
  disabled?: boolean;
}

const MODES = [
  {
    id: "investigation" as ModeType,
    label: "Investigation",
    icon: ShieldAlert,
    tagline: "Forensic Truth-Seeking",
    precision: "Minute Precision",
    color: "from-amber-500/20 to-rose-500/20 text-amber-400 border-amber-500/30",
    activePill: "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20",
  },
  {
    id: "hiring" as ModeType,
    label: "Hiring",
    icon: Briefcase,
    tagline: "Reference Verification",
    precision: "Day Precision",
    color: "from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30",
    activePill: "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-blue-500/20",
  },
  {
    id: "diary" as ModeType,
    label: "Diary",
    icon: BookOpen,
    tagline: "Reflective Memory",
    precision: "Hour Precision",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    activePill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20",
  },
];

export function ModeSelector({
  currentMode,
  onModeChange,
  disabled = false,
}: ModeSelectorProps) {
  const activeModeData = MODES.find((m) => m.id === currentMode) || MODES[0];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Pill tabs */}
      <div className="inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner backdrop-blur-md">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer",
                isActive
                  ? cn(
                      "bg-slate-800 shadow-md border border-slate-700",
                      m.activePill
                    )
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mode metadata badge */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded-lg">
        <Clock className="w-3 h-3 text-slate-500" />
        <span className="text-slate-300 font-mono">{activeModeData.precision}</span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400 italic">{activeModeData.tagline}</span>
      </div>
    </div>
  );
}
