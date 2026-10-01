"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  MapPin,
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
import { useI18n } from "@/locales/i18n-context";
import { useDynamicTranslations } from "@/locales/dynamic-translation";
import { useTranslatedPayload } from "@/locales/translated-payload";
import {
  EVIDENCE_KIND_LABEL_KEYS,
  FINDING_TYPE_LABEL_KEYS,
  BCP47_LOCALES,
} from "@/locales/translations";
import type { TranslationKey } from "@/locales/translations";

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

type FilterTab = "all" | "claim" | "evidence" | "finding";

export function Timeline({ claims, evidenceList, findings }: TimelineProps) {
  const { t, lang } = useI18n();
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [filter, setFilter] = useState<FilterTab>("all");

  const filterLabels: Record<FilterTab, TranslationKey> = {
    all: "filter_all",
    claim: "filter_claims",
    evidence: "filter_evidence",
    finding: "filter_findings",
  };

  // Display-only translations of stored content (originals stay verbatim — audit chain safe)
  const dynamicTexts = useMemo(
    () => [
      ...claims.flatMap((c) => [
        c.what,
        ...(c.who ? [c.who] : []),
        ...(c.place ? [c.place] : []),
      ]),
      ...evidenceList.flatMap((e) => [
        e.description,
        e.source,
        ...(e.place ? [e.place] : []),
      ]),
      ...findings.map((f) => f.explanation),
    ],
    [claims, evidenceList, findings]
  );
  const { translations } = useDynamicTranslations(dynamicTexts);

  // Knowledge-graph translation: node labels + localized edge relationship
  // tags ("contradicts", "corroborates", "occurs before") in one request.
  const graphPayload = useMemo(
    () => ({
      nodes: [
        ...claims.map((c, i) => ({ id: `c-${i}`, label: c.what })),
        ...evidenceList.map((e, i) => ({ id: `e-${i}`, label: e.description })),
        ...findings.map((f, i) => ({ id: `f-${i}`, label: f.explanation })),
      ],
    }),
    [claims, evidenceList, findings]
  );
  const { data: translatedGraph } = useTranslatedPayload(graphPayload, lang);

  // Sentinel sorts unanchored claims first and findings last (pure, no Date.now())
  const FINDINGS_SENTINEL_MS = 8_640_000_000_000_000;

  // Compile and sort timeline items
  const items: TimelineItem[] = useMemo(() => {
    const list: TimelineItem[] = [];

    claims.forEach((c, idx) => {
      const time = c.time_start || c.time_expression || "\u2014";
      const ms = c.time_start ? new Date(c.time_start).getTime() : NaN;
      list.push({
        id: c.id || `cl-${idx}`,
        type: "claim",
        title: translations[c.what] ?? c.what,
        subtitle: c.who
          ? `${t("claimed_by")}: ${translations[c.who] ?? c.who}`
          : undefined,
        place: c.place,
        timestamp: time,
        timeMs: isNaN(ms) ? 0 : ms,
        badge: t("badge_claim"),
        color: "border-accent/30 bg-accent-muted text-accent",
      });
    });

    evidenceList.forEach((e) => {
      const ms = new Date(e.timestamp).getTime();
      const kindKey = EVIDENCE_KIND_LABEL_KEYS[e.kind];
      list.push({
        id: e.id,
        type: "evidence",
        title: translations[e.description] ?? e.description,
        subtitle: `${t("source_label")}: ${translations[e.source] ?? e.source}`,
        place: e.place,
        timestamp: e.timestamp,
        timeMs: isNaN(ms) ? 0 : ms,
        badge: kindKey ? t(kindKey) : e.kind.replace("_", " "),
        color: "border-success/30 bg-success-light text-success",
      });
    });

    findings.forEach((f, idx) => {
      const typeKey = FINDING_TYPE_LABEL_KEYS[f.type];
      const typeText = typeKey ? t(typeKey) : f.type.replace("_", " ");
      list.push({
        id: f.id || `f-${idx}`,
        type: "finding",
        title: translations[f.explanation] ?? f.explanation,
        subtitle: `${t("type_label")}: ${typeText}`,
        place: null,
        timestamp: t("flagged_anomaly"),
        timeMs: FINDINGS_SENTINEL_MS,
        badge: typeText,
        color: "border-danger/30 bg-danger-light text-danger",
      });
    });

    return list.sort((a, b) => a.timeMs - b.timeMs);
  }, [claims, evidenceList, findings, t, translations]);

  const filteredItems = items.filter((i) =>
    filter === "all" ? true : i.type === filter
  );

  // Generate React Flow graph nodes & edges — labels come from the translated
  // graph payload (display-only; underlying data untouched for hashing).
  const { graphNodes, graphEdges } = useMemo(() => {
    const EDGE_TAG_KEYS = {
      contradicts: "edge_contradicts" as const,
      corroborates: "edge_corroborates" as const,
      occurs_before: "edge_occurs_before" as const,
    };
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const claimLabel = (idx: number, fallback: string) =>
      translatedGraph?.nodes?.find((n) => n?.id === `c-${idx}`)?.label ?? fallback;
    const evidenceLabel = (idx: number, fallback: string) =>
      translatedGraph?.nodes?.find((n) => n?.id === `e-${idx}`)?.label ?? fallback;

    let yOffset = 20;

    claims.forEach((c, idx) => {
      const nodeId = `node-c-${c.id || idx}`;
      const label = claimLabel(idx, c.what);
      nodes.push({
        id: nodeId,
        position: { x: 40, y: yOffset },
        data: { label: `${t("graph_claim_prefix")}: ${label.slice(0, 32)}...` },
        style: {
          background: "#eff6ff",
          color: "#1d4ed8",
          border: "1px solid #93c5fd",
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
      const label = evidenceLabel(idx, ev.source);
      nodes.push({
        id: evNodeId,
        position: { x: 340, y: evYOffset },
        data: { label: `${t("graph_evidence_prefix")}: ${label}` },
        style: {
          background: "#dcfce7",
          color: "#15803d",
          border: "1px solid #86efac",
          borderRadius: "8px",
          padding: "8px",
          fontSize: "11px",
          width: 200,
        },
      });

      if (claims[0]) {
        edges.push({
          id: `edge-${idx}`,
          source: `node-c-${claims[0].id || 0}`,
          target: evNodeId,
          animated: true,
          label: findings.length > 0 ? t(EDGE_TAG_KEYS.contradicts) : t(EDGE_TAG_KEYS.corroborates),
          labelShowBg: true,
          labelBgPadding: [4, 2],
          labelStyle: { fontSize: 10, fill: "#64748b" },
          style: { stroke: "#2563eb", strokeWidth: 1.5 },
        });
      }
      evYOffset += 75;
    });

    return { graphNodes: nodes, graphEdges: edges };
  }, [claims, evidenceList, findings, t, translatedGraph]);

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col h-full max-h-[720px]">
      {/* Top Header & View Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold text-ink uppercase tracking-wide">
            {t("timeline_title")}
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer",
              viewMode === "list"
                ? "bg-white text-accent shadow-sm"
                : "text-muted hover:text-ink"
            )}
          >
            <Layers className="w-3 h-3" />
            <span>{t("list_view")}</span>
          </button>
          <button
            onClick={() => setViewMode("graph")}
            className={cn(
              "px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer",
              viewMode === "graph"
                ? "bg-white text-accent shadow-sm"
                : "text-muted hover:text-ink"
            )}
          >
            <GitBranch className="w-3 h-3" />
            <span>{t("graph_view")}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (in list mode) */}
      {viewMode === "list" && (
        <div className="flex items-center gap-1 py-2 text-xs border-b border-slate-200 overflow-x-auto">
          {(Object.keys(filterLabels) as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-2 py-1 rounded-lg transition-colors cursor-pointer",
                filter === tab
                  ? "bg-accent-muted text-accent font-semibold border border-accent-light"
                  : "text-muted hover:text-ink border border-transparent"
              )}
            >
              {t(filterLabels[tab])}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto mt-2 pr-1">
        {viewMode === "list" ? (
          filteredItems.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted">
              {t("no_timeline")}
            </div>
          ) : (
            <div className="relative pl-4 space-y-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
              {filteredItems.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute -left-[14px] top-2 w-2 h-2 rounded-full border bg-white",
                      item.type === "finding"
                        ? "border-danger bg-danger"
                        : item.type === "evidence"
                        ? "border-success bg-success"
                        : "border-accent bg-accent"
                    )}
                  />
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all text-sm space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold border",
                          item.color
                        )}
                      >
                        {item.badge}
                      </span>
                      <span className="text-xs text-muted font-mono">
                        {item.timestamp.includes("T")
                          ? new Date(item.timestamp).toLocaleTimeString(
                              BCP47_LOCALES[lang],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : item.timestamp}
                      </span>
                    </div>

                    <p className="text-sm text-ink font-medium leading-snug line-clamp-2">
                      {item.title}
                    </p>

                    {item.place && (
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <MapPin className="w-3 h-3" />
                        <span>{translations[item.place] ?? item.place}</span>
                      </div>
                    )}

                    {item.subtitle && (
                      <div className="text-xs text-muted italic">{item.subtitle}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* React Flow Graph View */
          <div className="h-96 w-full rounded-lg overflow-hidden border border-slate-200 bg-canvas">
            <ReactFlow
              nodes={graphNodes}
              edges={graphEdges}
              fitView
              colorMode="light"
            >
              <Background color="#e2e8f0" gap={16} />
              <Controls />
            </ReactFlow>
          </div>
        )}
      </div>
    </div>
  );
}
