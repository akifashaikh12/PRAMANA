"use client";

import React, { useState } from "react";
import { Terminal, Activity, ChevronDown, ChevronUp, Cpu, CheckCircle } from "lucide-react";
import { AgentLog } from "@/agent/state";
import { cn } from "@/lib/utils";

interface AgentActivityProps {
  logs: AgentLog[];
  isExecuting?: boolean;
}

const PIPELINE_NODES = [
  "EXTRACT_CLAIMS",
  "CHECK_SLOTS",
  "GENERATE_CLARIFICATION",
  "EVALUATE_EVIDENCE",
  "GENERATE_COACH",
];

export function AgentActivity({ logs, isExecuting = false }: AgentActivityProps) {
  const [expanded, setExpanded] = useState(false);

  const activeNodes = new Set(logs.map((l) => l.step));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-xl backdrop-blur-md space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className={cn("w-4 h-4", isExecuting ? "text-amber-400 animate-spin" : "text-slate-400")} />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Agent Orchestration
          </h3>
          {isExecuting && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono animate-pulse">
              Running Graph...
            </span>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span className="text-[11px]">{expanded ? "Collapse" : "Trace Logs"}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Visual Pipeline Node Steps */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
        {PIPELINE_NODES.map((node, i) => {
          const isDone = activeNodes.has(node);
          return (
            <React.Fragment key={node}>
              <div
                className={cn(
                  "px-2 py-1 rounded-md border flex items-center gap-1 shrink-0 transition-all",
                  isDone
                    ? "bg-slate-950 border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-500/10"
                    : "bg-slate-950/40 border-slate-800 text-slate-500"
                )}
              >
                {isDone && <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />}
                <span>{node}</span>
              </div>
              {i < PIPELINE_NODES.length - 1 && (
                <span className="text-slate-700 shrink-0">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Expanded Log Console */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-slate-800 font-mono text-[10px] space-y-1.5 max-h-48 overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">No agent execution steps recorded yet.</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="text-amber-400 font-bold shrink-0">[{log.step}]</span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
