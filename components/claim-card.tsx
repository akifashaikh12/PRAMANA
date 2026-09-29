"use client";

import React from "react";
import { User, MapPin, Clock, Quote, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { ExtractedClaim } from "@/agent/schemas";
import { cn } from "@/lib/utils";

interface ClaimCardProps {
  claim: ExtractedClaim;
  index: number;
  highlighted?: boolean;
}

export function ClaimCard({ claim, index, highlighted = false }: ClaimCardProps) {
  const getStatusBadge = (status: ExtractedClaim["status"]) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-2.5 h-2.5" />
            Verified
          </span>
        );
      case "disputed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-full">
            <ShieldAlert className="w-2.5 h-2.5" />
            Disputed / Conflict
          </span>
        );
      case "needs_clarification":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-2.5 h-2.5" />
            Needs Clarification
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-full">
            Pending
          </span>
        );
    }
  };

  const hasMissing = claim.unknown_slots && claim.unknown_slots.length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 transition-all duration-200 backdrop-blur-sm",
        highlighted
          ? "bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10"
          : "bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90"
      )}
    >
      {/* Top Bar: Claim Index, Action Description, Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
            C-{index + 1}
          </span>
          <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
            {claim.what}
          </h4>
        </div>
        <div>{getStatusBadge(claim.status)}</div>
      </div>

      {/* Verbatim Source Quote */}
      <div className="flex items-start gap-1.5 p-2 bg-slate-950/60 border border-slate-800/70 rounded-lg text-slate-300 text-xs italic mb-2.5">
        <Quote className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
        <span className="line-clamp-2">"{claim.source_quote}"</span>
      </div>

      {/* Semantic Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
        {/* WHO slot */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md border",
            claim.who
              ? "bg-slate-950/40 border-slate-800/70 text-slate-300"
              : "bg-amber-950/20 border-amber-800/40 text-amber-400"
          )}
        >
          <User className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">
            {claim.who || <span className="italic">Who: Ambiguous</span>}
          </span>
        </div>

        {/* WHERE / PLACE slot */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md border",
            claim.place
              ? "bg-slate-950/40 border-slate-800/70 text-slate-300"
              : "bg-amber-950/20 border-amber-800/40 text-amber-400"
          )}
        >
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">
            {claim.place || <span className="italic">Place: Missing</span>}
          </span>
        </div>

        {/* WHEN / TIME slot */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md border font-mono text-[10px]",
            claim.time_start || claim.time_expression
              ? "bg-slate-950/40 border-slate-800/70 text-slate-300"
              : "bg-amber-950/20 border-amber-800/40 text-amber-400"
          )}
        >
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate" title={claim.time_start || claim.time_expression || ""}>
            {claim.time_expression ||
              (claim.time_start ? new Date(claim.time_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Time: Unanchored")}
          </span>
        </div>
      </div>

      {/* Missing Required Slots Alert */}
      {hasMissing && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
          <span className="text-amber-400/90 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-2.5 h-2.5" /> Missing required slots:
          </span>
          <div className="flex gap-1">
            {claim.unknown_slots.map((s) => (
              <span
                key={s}
                className="bg-amber-950/60 border border-amber-800/60 text-amber-300 px-1.5 py-0.5 rounded font-mono uppercase"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
