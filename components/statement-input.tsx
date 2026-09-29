"use client";

import React, { useState } from "react";
import { Send, User, Calendar, Sparkles, Loader2 } from "lucide-react";
import { VoiceInput } from "./voice-input";
import { cn } from "@/lib/utils";

interface StatementInputProps {
  onSubmit: (data: {
    narrator: string;
    statement: string;
    statementDate: string;
  }) => Promise<void>;
  isLoading?: boolean;
  defaultNarrator?: string;
}

export function StatementInput({
  onSubmit,
  isLoading = false,
  defaultNarrator = "",
}: StatementInputProps) {
  const [narrator, setNarrator] = useState(defaultNarrator);
  const [statement, setStatement] = useState("");
  const [statementDate, setStatementDate] = useState(
    () => new Date().toISOString().slice(0, 16)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim() || isLoading) return;

    await onSubmit({
      narrator: narrator.trim() || "Anonymous",
      statement: statement.trim(),
      statementDate: new Date(statementDate).toISOString(),
    });

    setStatement("");
  };

  const handleQuickInsert = (text: string, speaker: string) => {
    setNarrator(speaker);
    setStatement(text);
  };

  const handleVoiceTranscribe = (transcribedText: string) => {
    setStatement((prev) =>
      prev.trim() ? `${prev.trim()} ${transcribedText}` : transcribedText
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3.5"
    >
      {/* Top Controls: Narrator, Date & Voice Assistant */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-between">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Narrator Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <User className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={narrator}
              onChange={(e) => setNarrator(e.target.value)}
              placeholder="Narrator / Witness Name"
              disabled={isLoading}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            />
          </div>

          {/* Statement Date/Time Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <input
              type="datetime-local"
              value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)}
              disabled={isLoading}
              className="pl-9 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-mono"
            />
          </div>
        </div>

        {/* Integrated Multi-Lingual Voice Assistant */}
        <div className="shrink-0">
          <VoiceInput
            onTranscribe={handleVoiceTranscribe}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Main Narrative Textarea */}
      <div className="relative">
        <textarea
          rows={3}
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="Enter statement, testimony, or narrative recall, or use Voice Input (English, Hindi, Gujarati). PRAMANA will extract atomic claims, flag ambiguities, and verify against evidence logs..."
          disabled={isLoading}
          className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/60 focus:border-amber-500/60 transition-all resize-none leading-relaxed"
        />
        <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-500">
          {statement.length} chars
        </div>
      </div>

      {/* Footer Controls: Quick Presets & Submit */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline">Try preset:</span>
          <button
            type="button"
            onClick={() =>
              handleQuickInsert(
                "I arrived at the headquarters at 1:45 PM. I stayed in the first-floor main lobby having coffee until 2:30 PM. I never went near the basement or the server vault. Later that evening around 6:00 PM, I met Sarah for dinner across town.",
                "Marcus Vance"
              )
            }
            className="text-[10px] bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50 transition-colors cursor-pointer"
          >
            Alibi Statement
          </button>
          <button
            type="button"
            onClick={() =>
              handleQuickInsert(
                "Someone was hanging around somewhere near the corridor yesterday afternoon, but I don't recall who it was.",
                "Witness B"
              )
            }
            className="text-[10px] bg-slate-800/80 hover:bg-slate-700/80 text-amber-300/80 px-2 py-0.5 rounded-md border border-amber-500/30 transition-colors cursor-pointer"
          >
            Ambiguous Statement
          </button>
        </div>

        <button
          type="submit"
          disabled={!statement.trim() || isLoading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200",
            statement.trim() && !isLoading
              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
              : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Pipeline...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit to Engine</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
