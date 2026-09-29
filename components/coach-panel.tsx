"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck, Copy, Check, Target, Compass, HelpCircle } from "lucide-react";
import { CoachQuestion } from "@/agent/schemas";
import { cn } from "@/lib/utils";

interface CoachPanelProps {
  coachQuestion: CoachQuestion | null;
  onUseQuestion?: (question: string) => void;
}

export function CoachPanel({ coachQuestion, onUseQuestion }: CoachPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!coachQuestion) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md text-center py-8 space-y-2">
        <Compass className="w-6 h-6 text-slate-600 mx-auto animate-spin" />
        <h4 className="text-xs font-semibold text-slate-300">Cognitive Coach Idle</h4>
        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
          Submit or load statements and evidence to dynamically generate the next-best non-leading inquiry.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(coachQuestion.question);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityStyle = (priority: CoachQuestion["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-rose-950/70 border-rose-800/80 text-rose-300";
      case "medium":
        return "bg-amber-950/70 border-amber-800/80 text-amber-300";
      case "low":
      default:
        return "bg-blue-950/70 border-blue-800/80 text-blue-300";
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/40 rounded-2xl p-4 shadow-xl shadow-amber-500/5 backdrop-blur-md space-y-3.5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Next-Best Question
            </h3>
            <span className="text-[10px] text-amber-400 font-medium">
              Cognitive Interview Coach
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border",
              getPriorityStyle(coachQuestion.priority)
            )}
          >
            {coachQuestion.priority} Priority
          </span>
        </div>
      </div>

      {/* Main Question Quote Box */}
      <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl relative group">
        <p className="text-sm font-semibold text-slate-100 leading-relaxed">
          "{coachQuestion.question}"
        </p>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/70 text-[11px]">
          <div className="flex items-center gap-1 text-emerald-400 font-medium text-[10px]">
            <ShieldCheck className="w-3 h-3" />
            <span>Non-Leading Guardrail Passed</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors rounded hover:bg-slate-800"
              title="Copy question"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {onUseQuestion && (
              <button
                onClick={() => onUseQuestion(coachQuestion.question)}
                className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded transition-colors"
              >
                Use Inquiry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Strategic Rationale */}
      <div className="space-y-1">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
          <Target className="w-3 h-3 text-slate-500" />
          <span>Tactical Rationale</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/70">
          {coachQuestion.reason}
        </p>
      </div>

      {/* Target Slot Tag */}
      {coachQuestion.target_slot && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
          <span>Targeted semantic slot:</span>
          <span className="font-mono uppercase bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-slate-700">
            {coachQuestion.target_slot}
          </span>
        </div>
      )}
    </div>
  );
}
