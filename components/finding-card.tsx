"use client";

import React from "react";
import {
  AlertTriangle,
  Clock,
  MapPin,
  GitCommit,
  Split,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { Finding } from "@/agent/schemas";
import { cn } from "@/lib/utils";

interface FindingCardProps {
  finding: Finding;
  onStatusChange?: (id: string, status: string) => void;
}

export function FindingCard({ finding, onStatusChange }: FindingCardProps) {
  const getFindingMeta = (type: Finding["type"]) => {
    switch (type) {
      case "location_conflict":
        return {
          icon: MapPin,
          label: "Location Conflict",
          color: "border-rose-500/60 bg-rose-950/40 text-rose-300",
          badgeColor: "bg-rose-900/60 text-rose-300 border-rose-700/60",
          severity: "Critical Contradiction",
        };
      case "time_conflict":
        return {
          icon: Clock,
          label: "Time Conflict",
          color: "border-amber-500/60 bg-amber-950/40 text-amber-300",
          badgeColor: "bg-amber-900/60 text-amber-300 border-amber-700/60",
          severity: "Temporal Discrepancy",
        };
      case "timeline_gap":
        return {
          icon: Split,
          label: "Timeline Gap",
          color: "border-purple-500/60 bg-purple-950/40 text-purple-300",
          badgeColor: "bg-purple-900/60 text-purple-300 border-purple-700/60",
          severity: "Unaccounted Interval",
        };
      case "statement_dispute":
        return {
          icon: ShieldAlert,
          label: "Statement Dispute",
          color: "border-orange-500/60 bg-orange-950/40 text-orange-300",
          badgeColor: "bg-orange-900/60 text-orange-300 border-orange-700/60",
          severity: "Corroboration Conflict",
        };
      case "internal_inconsistency":
      default:
        return {
          icon: AlertTriangle,
          label: "Internal Inconsistency",
          color: "border-rose-500/60 bg-rose-950/40 text-rose-300",
          badgeColor: "bg-rose-900/60 text-rose-300 border-rose-700/60",
          severity: "Self-Contradiction",
        };
    }
  };

  const meta = getFindingMeta(finding.type);
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 backdrop-blur-md transition-all duration-200 shadow-md",
        meta.color
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold tracking-wide">{meta.label}</span>
        </div>
        <span
          className={cn(
            "text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border",
            meta.badgeColor
          )}
        >
          {meta.severity}
        </span>
      </div>

      {/* Explanation */}
      <p className="text-xs leading-relaxed text-slate-200 font-medium mb-3">
        {finding.explanation}
      </p>

      {/* Footer / Links */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
        <div className="flex items-center gap-2 font-mono">
          {finding.claim_id && (
            <span className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
              Claim: {finding.claim_id}
            </span>
          )}
          {finding.evidence_id && (
            <span className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
              Ref: {finding.evidence_id}
            </span>
          )}
        </div>

        {onStatusChange && (
          <button
            onClick={() =>
              onStatusChange(
                finding.id || "",
                finding.status === "resolved" ? "open" : "resolved"
              )
            }
            className="flex items-center gap-1 text-[10px] hover:text-white transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{finding.status === "resolved" ? "Reopen" : "Acknowledge"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
