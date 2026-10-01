"use client";

import React, { useState, useEffect, useCallback, useRef, use, useMemo } from "react";
import {
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import {
  ModeSelector,
  ModeType,
} from "@/components/mode-selector";
import { Header } from "@/components/header";
import { StatementInput } from "@/components/statement-input";
import { ClaimCard } from "@/components/claim-card";
import { ClarificationGate } from "@/components/clarification-gate";
import { Timeline } from "@/components/timeline";
import { EvidenceTable } from "@/components/evidence-table";
import { FindingCard } from "@/components/finding-card";
import { CoachPanel } from "@/components/coach-panel";
import { AnalysisPanel } from "@/components/analysis-panel";
import { AgentActivity } from "@/components/agent-activity";
import { HashChainStatus } from "@/components/hash-chain-status";
import { CaseSelector } from "@/components/case-selector";
import { AuditTrail } from "@/components/audit-trail";

import {
  ExtractedClaim,
  Evidence,
  Finding,
  CoachQuestion,
  StatementRecord,
  CaseMeta,
} from "@/agent/schemas";
import { AgentLog, UnresolvedSlot } from "@/agent/state";
import { GENESIS_HASH } from "@/tools";
import { synthesizeDecisions } from "@/lib/decisions";

import investigationDemo from "@/demo/investigation-case.json";
import hiringDemo from "@/demo/hiring-case.json";
import familyDemo from "@/demo/family-case.json";
import { useI18n } from "@/locales/i18n-context";
import { lookupGlossary } from "@/lib/demo-glossary";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Union of the three static demo case modules (pure, import-time data). */
type DemoCase =
  | typeof investigationDemo
  | typeof hiringDemo
  | typeof familyDemo;

/** Pure mapping from URL id to demo module + mode (investigation is default). */
function pickDemo(id: string): { demo: DemoCase; mode: ModeType } {
  if (id.includes("hiring")) return { demo: hiringDemo, mode: "hiring" };
  if (id.includes("diary") || id.includes("family")) return { demo: familyDemo, mode: "diary" };
  return { demo: investigationDemo, mode: "investigation" };
}

export default function CaseWorkspacePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.id;
  const { t, lang } = useI18n();

  // Seed initial state directly from the demo matching the URL id (no mount flash)
  const initial = pickDemo(caseId);

  // Active Mode State
  const [currentMode, setCurrentMode] = useState<ModeType>(initial.mode);
  const [caseTitle, setCaseTitle] = useState(initial.demo.case.title);

  // Core Agent Data
  const [statements, setStatements] = useState<StatementRecord[]>(
    initial.demo.statements as StatementRecord[]
  );
  const [claims, setClaims] = useState<ExtractedClaim[]>(
    initial.demo.claims as ExtractedClaim[]
  );
  const [evidenceList, setEvidenceList] = useState<Evidence[]>(
    initial.demo.evidence as Evidence[]
  );
  const [findings, setFindings] = useState<Finding[]>(
    initial.demo.findings as Finding[]
  );
  const [coachQuestion, setCoachQuestion] = useState<CoachQuestion | null>(
    (initial.demo.coachQuestion as CoachQuestion) ?? null
  );

  // Clarification Gate State
  const [unresolvedSlots, setUnresolvedSlots] = useState<UnresolvedSlot[]>([]);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);

  // Decisions Made (derived deterministically; recomputed on data change)
  const decisions = useMemo(
    () => synthesizeDecisions(claims, evidenceList),
    [claims, evidenceList]
  );

  // Execution Telemetry
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Persisted case metadata (null when working on a local/demo-only case)
  const [caseMeta, setCaseMeta] = useState<CaseMeta | null>(null);
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  /**
   * Record a sensitive modification in the immutable audit log and refresh
   * the trail. Silently skips when the case is not persisted (demo mode).
   * Original statement/claim text is NEVER altered here — only the audit
   * ledger is appended to, keeping the statement SHA-256 chain intact.
   */
  const auditTrail = useCallback(
    async (
      actionType: "STATEMENT_ADDED" | "EVIDENCE_MODIFIED" | "CLAIM_DELETED" | "CASE_UPDATED",
      previousState: unknown,
      newState: unknown
    ) => {
      if (!caseMeta) return;
      try {
        const res = await fetch(`/api/cases/${caseMeta.id}/audit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType,
            changedBy: "workspace_user",
            previousState,
            newState,
          }),
        });
        if (res.ok) setAuditRefreshKey((k) => k + 1);
      } catch {
        // Audit persistence is best-effort in demo/unconfigured mode
      }
    },
    [caseMeta]
  );

  const handleCaseChanged = useCallback((updated: CaseMeta | null) => {
    setCaseMeta(updated);
    if (updated) {
      setCaseTitle(updated.title);
      setAuditRefreshKey((k) => k + 1);
    }
  }, []);

  /** Load a demo case into local state (pure data in, state setters out). */
  const loadDemo = useCallback(
    (demo: DemoCase, mode: ModeType) => {
      setCurrentMode(mode);
      setCaseTitle(demo.case.title);
      setStatements(demo.statements as StatementRecord[]);
      setClaims(demo.claims as ExtractedClaim[]);
      setEvidenceList(demo.evidence as Evidence[]);
      setFindings(demo.findings as Finding[]);
      setCoachQuestion(demo.coachQuestion as CoachQuestion);
      setUnresolvedSlots([]);
      setClarificationQuestion(null);
      setLogs([
        {
          step: "CASE_LOADED",
          message: `Loaded "${demo.case.title}" (${mode} mode) with ${demo.statements.length} cryptographic statement(s), ${demo.claims.length} claim(s) and ${demo.evidence.length} evidence record(s).`,
          timestamp: new Date().toISOString(),
        },
      ]);
      showNotification(t("case_loaded"));
    },
    [showNotification, t]
  );

  const demoForMode = useCallback((mode: ModeType): DemoCase => {
    switch (mode) {
      case "hiring":
        return hiringDemo;
      case "diary":
        return familyDemo;
      default:
        return investigationDemo;
    }
  }, []);

  // Reload demo data when navigating between case ids (initial state is
  // seeded above; ref initialized with caseId skips the redundant mount run)
  const loadedCaseRef = useRef(caseId);
  useEffect(() => {
    if (loadedCaseRef.current === caseId) return;
    loadedCaseRef.current = caseId;
    const frame = requestAnimationFrame(() => {
      const next = pickDemo(caseId);
      loadDemo(next.demo, next.mode);
    });
    return () => cancelAnimationFrame(frame);
  }, [caseId, loadDemo]);

  // Switch mode handler
  const handleModeChange = useCallback(
    (mode: ModeType) => {
      loadDemo(demoForMode(mode), mode);
    },
    [loadDemo, demoForMode]
  );

  // Submit new statement to backend agent
  const handleStatementSubmit = async (data: {
    narrator: string;
    statement: string;
    statementDate: string;
  }) => {
    setIsProcessing(true);
    try {
      const latestPrevHash =
        statements.length > 0 ? statements[statements.length - 1].hash : GENESIS_HASH;

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          statement: data.statement,
          narrator: data.narrator,
          statementDate: data.statementDate,
          mode: currentMode,
          evidenceList,
          existingClaims: claims,
          prevHash: latestPrevHash,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Agent processing failed");
      }

      const agentState = json.state;
      const hashMeta = json.hashMetadata;

      // Update statements with cryptographic hash chain (verbatim body preserved)
      if (hashMeta) {
        const newStatementRecord: StatementRecord = {
          id: `st-${Date.now()}`,
          case_id: caseId,
          narrator: data.narrator,
          body: data.statement,
          statement_date: data.statementDate,
          prev_hash: hashMeta.prevHash,
          hash: hashMeta.currentHash,
          created_at: hashMeta.createdAt,
        };
        setStatements((prev) => [...prev, newStatementRecord]);
        void auditTrail("STATEMENT_ADDED", null, {
          narrator: data.narrator,
          hash: hashMeta.currentHash,
          length: data.statement.length,
        });
      }

      // Merge newly extracted claims
      setClaims((prev) => {
        const newClaims = agentState.extractedClaims || [];
        const existingIds = new Set(prev.map((c) => c.source_quote));
        const filteredNew = newClaims.filter((c: ExtractedClaim) => !existingIds.has(c.source_quote));
        return [...prev, ...filteredNew];
      });

      // Update findings
      if (agentState.findings) {
        setFindings(agentState.findings);
      }

      // Update next best question
      if (agentState.nextBestQuestion) {
        setCoachQuestion(agentState.nextBestQuestion);
      }

      // Update clarification gate
      if (agentState.unresolvedSlots && agentState.unresolvedSlots.length > 0) {
        setUnresolvedSlots(agentState.unresolvedSlots);
        setClarificationQuestion(agentState.clarificationQuestion);
      } else {
        setUnresolvedSlots([]);
        setClarificationQuestion(null);
      }

      // Merge logs
      if (agentState.logs) {
        setLogs((prev) => [...prev, ...agentState.logs]);
      }

      showNotification(t("case_loaded"));
    } catch (err: unknown) {
      console.error(err);
      showNotification(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit clarification resolution
  const handleResolveClarification = async (answer: string, slot: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          statement: `Clarification for slot [${slot}]: ${answer}`,
          narrator: statements[statements.length - 1]?.narrator || "Narrator",
          statementDate: new Date().toISOString(),
          mode: currentMode,
          evidenceList,
          existingClaims: claims,
          userClarificationAnswer: answer,
          unresolvedSlots,
          prevHash: statements.length > 0 ? statements[statements.length - 1].hash : GENESIS_HASH,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setUnresolvedSlots([]);
        setClarificationQuestion(null);
        if (json.state.findings) setFindings(json.state.findings);
        if (json.state.nextBestQuestion) setCoachQuestion(json.state.nextBestQuestion);
        if (json.state.logs) setLogs((prev) => [...prev, ...json.state.logs]);
        showNotification(t("resolve") + ": " + slot);
      }
    } catch (err: unknown) {
      console.error(err);
      showNotification("Failed to resolve clarification.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Add new evidence item
  const handleAddEvidence = (ev: Evidence) => {
    setEvidenceList((prev) => [ev, ...prev]);
    showNotification(`${t("evidence_label")}: ${ev.source}`);
    void auditTrail("EVIDENCE_MODIFIED", null, {
      added: { id: ev.id, kind: ev.kind, source: ev.source },
    });
  };

  // Delete a claim (sensitive modification — audit-logged, originals in any
  // persisted store are untouched; this affects the working set only)
  const handleDeleteClaim = useCallback(
    (claim: ExtractedClaim) => {
      setClaims((prev) => prev.filter((c) => c !== claim && c.source_quote !== claim.source_quote));
      showNotification(t("claim_deleted"));
      void auditTrail("CLAIM_DELETED", { id: claim.id, what: claim.what }, null);
    },
    [auditTrail, showNotification, t]
  );

  // Inject claims extracted from an uploaded resume (verbatim source lines kept)
  const handleAddClaims = useCallback(
    (newClaims: ExtractedClaim[], fileName: string) => {
      setClaims((prev) => {
        const existing = new Set(prev.map((c) => c.source_quote));
        const deduped = newClaims.filter((c) => !existing.has(c.source_quote));
        return [...prev, ...deduped];
      });
      showNotification(`${fileName}: +${newClaims.length} ${t("claims_title")}`);
    },
    [showNotification, t]
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* 1. TOP HEADER with Language Switcher */}
      <Header
        variant="compact"
        caseTitle={
          lang !== "en" ? (lookupGlossary(caseTitle, lang) ?? caseTitle) : caseTitle
        }
        caseId={caseId}
      />

      {/* Mode Tabs + Demo Switcher Row */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1720px] mx-auto px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <ModeSelector
            currentMode={currentMode}
            onModeChange={handleModeChange}
            disabled={isProcessing}
          />

          {/* Quick Demo Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <CaseSelector
              compact
              activeCaseId={caseMeta?.id ?? null}
              activeCaseTitle={caseMeta ? caseTitle : null}
              createMode={currentMode}
              onCaseChanged={handleCaseChanged}
            />
            <button
              onClick={() => handleModeChange("investigation")}
              className="btn-secondary h-8 text-xs"
              title="Load Investigation Demo Case"
            >
              {t("heist_case")}
            </button>
            <button
              onClick={() => handleModeChange("hiring")}
              className="btn-secondary h-8 text-xs"
              title="Load Hiring Reference Demo Case"
            >
              {t("hiring_case")}
            </button>
            <button
              onClick={() => handleModeChange("diary")}
              className="btn-secondary h-8 text-xs"
              title="Load Reflective Diary Demo Case"
            >
              {t("diary_case")}
            </button>
          </div>
        </div>
      </div>

      {/* Temporary Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-slate-200 shadow-lg text-ink text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{notification}</span>
        </div>
      )}

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: TIMELINE & CRYPTOGRAPHIC AUDIT */}
        <section className="lg:col-span-3 space-y-4 flex flex-col">
          <HashChainStatus statements={statements} />
          <AuditTrail caseId={caseMeta?.id ?? null} refreshKey={auditRefreshKey} />
          <div className="flex-1">
            <Timeline
              claims={claims}
              evidenceList={evidenceList}
              findings={findings}
            />
          </div>
        </section>

        {/* CENTER COLUMN: CLAIM WORKSPACE */}
        <section className="lg:col-span-5 space-y-4 flex flex-col">
          <StatementInput
            onSubmit={handleStatementSubmit}
            onAddEvidence={handleAddEvidence}
            onAddClaims={handleAddClaims}
            isLoading={isProcessing}
            mode={currentMode}
            defaultNarrator={
              statements.length > 0 ? statements[statements.length - 1].narrator : ""
            }
          />

          <ClarificationGate
            unresolvedSlots={unresolvedSlots}
            clarificationQuestion={clarificationQuestion}
            onResolve={handleResolveClarification}
            isLoading={isProcessing}
          />

          {/* Extracted Atomic Claims List */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wide">
                  {t("claims_title")}
                </h3>
                <span className="text-xs bg-accent-muted text-accent px-2 py-0.5 rounded-full font-mono font-semibold border border-accent-light">
                  {claims.length}
                </span>
              </div>
              <span className="text-xs text-muted">
                {t("mode_label")}: <span className="font-semibold text-ink capitalize">{currentMode}</span>
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[580px] pr-1">
              {claims.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted">
                  {t("no_claims")}
                </div>
              ) : (
                claims.map((claim, idx) => (
                  <ClaimCard
                    key={claim.id || idx}
                    claim={claim}
                    index={idx}
                    highlighted={claim.status === "disputed"}
                    onClaimDelete={handleDeleteClaim}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: CONFLICT ENGINE, COACH & AUDIT RECORDS */}
        <section className="lg:col-span-4 space-y-4 flex flex-col">
          <AnalysisPanel
            decisions={decisions}
            findings={findings}
            coachQuestionText={coachQuestion?.question ?? null}
          />

          <CoachPanel
            coachQuestion={coachQuestion}
            onUseQuestion={(q) => showNotification(`"${q}"`)}
          />

          {/* Structured Evidentiary Findings */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-danger" />
                <h3 className="text-xs font-bold text-ink uppercase tracking-wide">
                  {t("findings_title")}
                </h3>
              </div>
              <span className="text-xs bg-danger-light text-danger border border-danger/20 px-2 py-0.5 rounded-full font-mono font-bold">
                {findings.length}
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {findings.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted">
                  {t("no_findings")}
                </div>
              ) : (
                findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    onStatusChange={(id, status) => {
                      setFindings((prev) =>
                        prev.map((f) => (f.id === id ? { ...f, status } : f))
                      );
                      showNotification(`${t("findings_title")}: ${status}`);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <EvidenceTable
            evidenceList={evidenceList}
            onAddEvidence={handleAddEvidence}
          />

          <AgentActivity logs={logs} isExecuting={isProcessing} />
        </section>
      </main>
    </div>
  );
}