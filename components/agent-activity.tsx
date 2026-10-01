"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Cpu, CheckCircle } from "lucide-react";
import { AgentLog } from "@/agent/state";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/i18n-context";

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
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const activeNodes = new Set(logs.map((l) => l.step));

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu
            className={cn(
              "w-4 h-4",
              isExecuting ? "text-accent animate-pulse" : "text-muted"
            )}
          />
          <h3 className="text-xs font-bold text-ink uppercase tracking-wide">
            {t("agent_activity")}
          </h3>
          {isExecuting && (
            <span className="flex items-center gap-1 text-xs text-accent font-mono animate-pulse">
              {t("running_graph")}
            </span>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted hover:text-ink text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <span>{expanded ? t("collapse") : t("trace_logs")}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Visual Pipeline Node Steps */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
        {PIPELINE_NODES.map((node, i) => {
          const isDone = activeNodes.has(node);
          return (
            <React.Fragment key={node}>
              <div
                className={cn(
                  "px-2 py-1 rounded-lg border flex items-center gap-1 shrink-0 transition-all",
                  isDone
                    ? "bg-success-light border-success/30 text-success"
                    : "bg-slate-50 border-slate-200 text-muted"
                )}
              >
                {isDone && <CheckCircle className="w-3 h-3" />}
                <span>{node}</span>
              </div>
              {i < PIPELINE_NODES.length - 1 && (
                <span className="text-slate-300 shrink-0">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Expanded Log Console */}
      {expanded && (
        <div className="pt-3 border-t border-slate-200 font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-200">
          {logs.length === 0 ? (
            <div className="text-muted italic">{t("no_logs")}</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-muted shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="text-accent font-bold shrink-0">[{log.step}]</span>
                <span className="text-ink-secondary">{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
