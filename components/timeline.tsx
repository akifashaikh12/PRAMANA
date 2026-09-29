"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  MapPin,
  ShieldAlert,
  FileText,
  Database,
  Calendar,
  Layers,
  GitBranch,
} from "lucide-react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ExtractedClaim, Evidence, Finding } from "@/agent/schemas";
import { cn } from "@/lib/utils";

interface TimelineProps {
  claims: ExtractedClaim[];
  evidenceList: Evidence[];
  findings: Finding[];
}

interface TimelineItem {
  id: string;
  type: "claim" | "evidence" | "finding";
  title: string;
  subtitle?: string;
  place?: string | null;
  timestamp: string;
  timeMs: number;
  badge: string;
  color: string;
}

export function Timeline({ claims, evidenceList, findings }: TimelineProps) {
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [filter, setFilter] = useState<"all" | "claim" | "evidence" | "finding">("all");

  // Compile and sort timeline items
  const items: TimelineItem[] = useMemo(() => {
    const list: TimelineItem[] = [];

    // Add claims
    claims.forEach((c) => {
      const time = c.time_start || c.time_expression || new Date().toISOString();
      const ms = new Date(time).getTime();
      list.push({
        id: c.id || `cl-${Math.random()}`,
        type: "claim",
        title: c.what,
        subtitle: c.who ? `Claimed by: ${c.who}` : undefined,
        place: c.place,
        timestamp: time,
        timeMs: isNaN(ms) ? Date.now() : ms,
        badge: "Claim",
        color: "border-blue-500/50 bg-blue-500/10 text-blue-400",
      });
    });

    // Add evidence
    evidenceList.forEach((e) => {
      const ms = new Date(e.timestamp).getTime();
      list.push({
        id: e.id,
        type: "evidence",
        title: e.description,
        subtitle: `Source: ${e.source}`,
        place: e.place,
        timestamp: e.timestamp,
        timeMs: isNaN(ms) ? Date.now() : ms,
        badge: e.kind.replace("_", " "),
        color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
      });
    });

    // Add findings
    findings.forEach((f) => {
      list.push({
        id: f.id || `f-${Math.random()}`,
        type: "finding",
        title: f.explanation,
        subtitle: `Type: ${f.type.replace("_", " ")}`,
        place: null,
        timestamp: "Flagged Anomaly",
        timeMs: Date.now() + 1000,
        badge: f.type.replace("_", " "),
        color: "border-rose-500/50 bg-rose-500/10 text-rose-400",
      });
    });

    return list.sort((a, b) => a.timeMs - b.timeMs);
  }, [claims, evidenceList, findings]);

  const filteredItems = items.filter((i) =>
    filter === "all" ? true : i.type === filter
  );

  // Generate React Flow graph nodes & edges
  const { graphNodes, graphEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    let yOffset = 20;

    claims.forEach((c, idx) => {
      const nodeId = `node-c-${c.id || idx}`;
      nodes.push({
        id: nodeId,
        position: { x: 40, y: yOffset },
        data: { label: `Claim: ${c.what.slice(0, 32)}...` },
        style: {
          background: "#0f172a",
          color: "#93c5fd",
          border: "1px solid #3b82f6",
          borderRadius: "8px",
          padding: "8px",
          fontSize: "11px",
          width: 220,
        },
      });
      yOffset += 75;
    });

    let evYOffset = 20;
    evidenceList.forEach((ev, idx) => {
      const evNodeId = `node-ev-${ev.id || idx}`;
      nodes.push({
        id: evNodeId,
        position: { x: 340, y: evYOffset },
        data: { label: `Evidence: ${ev.source}` },
        style: {
          background: "#022c22",
          color: "#6ee7b7",
          border: "1px solid #10b981",
          borderRadius: "8px",
          padding: "8px",
          fontSize: "11px",
          width: 200,
        },
      });

      // Link first claim to related evidence for visual correlation
      if (claims[0]) {
        edges.push({
          id: `edge-${idx}`,
          source: `node-c-${claims[0].id || 0}`,
          target: evNodeId,
          animated: true,
          style: { stroke: "#f59e0b", strokeWidth: 1.5 },
        });
      }
      evYOffset += 75;
    });

    return { graphNodes: nodes, graphEdges: edges };
  }, [claims, evidenceList]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col h-full max-h-[720px]">
      {/* Top Header & View Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Chronology & Graph
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors",
              viewMode === "list"
                ? "bg-slate-800 text-slate-200"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Layers className="w-3 h-3" />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode("graph")}
            className={cn(
              "px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors",
              viewMode === "graph"
                ? "bg-slate-800 text-slate-200"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <GitBranch className="w-3 h-3" />
            <span>Graph</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (in list mode) */}
      {viewMode === "list" && (
        <div className="flex items-center gap-1 py-2 text-[10px] border-b border-slate-800/60 overflow-x-auto">
          {(["all", "claim", "evidence", "finding"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-2 py-0.5 rounded capitalize transition-colors cursor-pointer",
                filter === tab
                  ? "bg-slate-800 text-amber-300 font-semibold border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto mt-2 pr-1">
        {viewMode === "list" ? (
          filteredItems.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              No timeline events recorded yet.
            </div>
          ) : (
            <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
              {filteredItems.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute -left-[14px] top-1.5 w-2 h-2 rounded-full border bg-slate-950",
                      item.type === "finding"
                        ? "border-rose-400 bg-rose-500 animate-ping"
                        : item.type === "evidence"
                        ? "border-emerald-400 bg-emerald-400"
                        : "border-blue-400 bg-blue-400"
                    )}
                  />
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all text-xs space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "text-[9px] uppercase font-mono px-1.5 py-0.2 rounded font-bold border",
                          item.color
                        )}
                      >
                        {item.badge}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.timestamp.includes("T")
                          ? new Date(item.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : item.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium leading-snug">
                      {item.title}
                    </p>

                    {item.place && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <MapPin className="w-2.5 h-2.5 text-slate-500" />
                        <span>{item.place}</span>
                      </div>
                    )}

                    {item.subtitle && (
                      <div className="text-[10px] text-slate-500 italic">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* React Flow Graph View */
          <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <ReactFlow
              nodes={graphNodes}
              edges={graphEdges}
              fitView
              colorMode="dark"
            >
              <Background color="#1e293b" gap={16} />
              <Controls />
            </ReactFlow>
          </div>
        )}
      </div>
    </div>
  );
}
