"use client";

import React, { useState } from "react";
import { HelpCircle, ArrowRight, CheckCircle2, ShieldQuestion, Loader2 } from "lucide-react";
import { UnresolvedSlot } from "@/agent/state";

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
  const [answer, setAnswer] = useState("");
  const currentSlot = unresolvedSlots[0];

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
    <div className="bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950 border border-amber-500/40 rounded-2xl p-4 shadow-xl shadow-amber-500/5 backdrop-blur-md space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wide">
          <ShieldQuestion className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Clarification Gate: Missing Required Slot</span>
        </div>
        {currentSlot && (
          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
            {currentSlot.slot}
          </span>
        )}
      </div>

      {/* Target Claim Quote & Question */}
      <div className="space-y-2">
        {currentSlot?.claimQuote && (
          <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            Anchor: "{currentSlot.claimQuote}"
          </p>
        )}
        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl">
          <p className="text-xs font-medium text-amber-100 leading-relaxed">
            {clarificationQuestion ||
              `Could you provide the missing ${currentSlot?.slot || "information"} for this claim?`}
          </p>
        </div>
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="space-y-2 pt-1">
        <div className="flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={`Provide clarifying ${currentSlot?.slot || "detail"} (e.g. specific room, name, or time)...`}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/60 focus:border-amber-500/60 transition-all"
          />
          <button
            type="submit"
            disabled={!answer.trim() || isLoading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Resolve</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
          <span>Quick fill:</span>
          <button
            type="button"
            onClick={() => handleQuickAnswer("Basement Vault Entrance at 14:02")}
            className="hover:text-amber-300 underline decoration-dotted"
          >
            "Basement Vault at 14:02"
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleQuickAnswer("North Wing Conference Room")}
            className="hover:text-amber-300 underline decoration-dotted"
          >
            "North Conference Room"
          </button>
        </div>
      </form>
    </div>
  );
}
