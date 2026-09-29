"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  FolderOpen,
  Share2,
  Sliders,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  ModeSelector,
  ModeType,
} from "@/components/mode-selector";
import { StatementInput } from "@/components/statement-input";
import { ClaimCard } from "@/components/claim-card";
import { ClarificationGate } from "@/components/clarification-gate";
import { Timeline } from "@/components/timeline";
import { EvidenceTable } from "@/components/evidence-table";
import { FindingCard } from "@/components/finding-card";
import { CoachPanel } from "@/components/coach-panel";
import { AgentActivity } from "@/components/agent-activity";
import { HashChainStatus } from "@/components/hash-chain-status";

import {
  ExtractedClaim,
  Evidence,
  Finding,
  CoachQuestion,
  StatementRecord,
} from "@/agent/schemas";
import { AgentLog, UnresolvedSlot } from "@/agent/state";
import { GENESIS_HASH, computeStatementHash } from "@/tools";

import investigationDemo from "@/demo/investigation-case.json";
import hiringDemo from "@/demo/hiring-case.json";
import familyDemo from "@/demo/family-case.json";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CaseWorkspacePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.id;

  // Active Mode State
  const [currentMode, setCurrentMode] = useState<ModeType>("investigation");
  const [caseTitle, setCaseTitle] = useState("Meridian Vault & Server Intrusion");

  // Core Agent Data
  const [statements, setStatements] = useState<StatementRecord[]>([]);
  const [claims, setClaims] = useState<ExtractedClaim[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [coachQuestion, setCoachQuestion] = useState<CoachQuestion | null>(null);

  // Clarification Gate State
  const [unresolvedSlots, setUnresolvedSlots] = useState<UnresolvedSlot[]>([]);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);

  // Execution Telemetry
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Load demo case based on ID or default to investigation
  useEffect(() => {
    if (caseId.includes("hiring")) {
      loadHiringDemo();
    } else if (caseId.includes("diary") || caseId.includes("family")) {
      loadDiaryDemo();
    } else {
      loadInvestigationDemo();
    }
  }, [caseId]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadInvestigationDemo = () => {
    setCurrentMode("investigation");
    setCaseTitle(investigationDemo.case.title);
    setStatements(investigationDemo.statements as StatementRecord[]);
    setClaims(investigationDemo.claims as ExtractedClaim[]);
    setEvidenceList(investigationDemo.evidence as Evidence[]);
    setFindings(investigationDemo.findings as Finding[]);
    setCoachQuestion(investigationDemo.coachQuestion as CoachQuestion);
    setUnresolvedSlots([]);
    setClarificationQuestion(null);
    setLogs([
      {
        step: "CASE_LOADED",
        message: "Loaded 'Meridian Vault Intrusion' demo with 2 cryptographic statements and 3 evidence records.",
        timestamp: new Date().toISOString(),
      },
      {
        step: "EVALUATE_EVIDENCE",
        message: "Verified SHA-256 chain. Flagged 1 location conflict and 1 unaccounted 3h timeline gap.",
        timestamp: new Date().toISOString(),
      },
    ]);
    showNotification("Loaded Investigation Demo Case");
  };

  const loadHiringDemo = () => {
    setCurrentMode("hiring");
    setCaseTitle(hiringDemo.case.title);
    setStatements(hiringDemo.statements as StatementRecord[]);
    setClaims(hiringDemo.claims as ExtractedClaim[]);
    setEvidenceList(hiringDemo.evidence as Evidence[]);
    setFindings(hiringDemo.findings as Finding[]);
    setCoachQuestion(hiringDemo.coachQuestion as CoachQuestion);
    setUnresolvedSlots([]);
    setClarificationQuestion(null);
    setLogs([
      {
        step: "CASE_LOADED",
        message: "Loaded 'Principal Architect Reference' demo in Hiring verification mode.",
        timestamp: new Date().toISOString(),
      },
    ]);
    showNotification("Loaded Hiring Demo Case");
  };

  const loadDiaryDemo = () => {
    setCurrentMode("diary");
    setCaseTitle(familyDemo.case.title);
    setStatements(familyDemo.statements as StatementRecord[]);
    setClaims(familyDemo.claims as ExtractedClaim[]);
    setEvidenceList(familyDemo.evidence as Evidence[]);
    setFindings(familyDemo.findings as Finding[]);
    setCoachQuestion(familyDemo.coachQuestion as CoachQuestion);
    setUnresolvedSlots([]);
    setClarificationQuestion(null);
    setLogs([
      {
        step: "CASE_LOADED",
        message: "Loaded '1994 Lake Trip' in Diary reflective memory mode. Preserving parallel recollections.",
        timestamp: new Date().toISOString(),
      },
    ]);
    showNotification("Loaded Diary Demo Case");
  };

  // Switch mode handler
  const handleModeChange = (mode: ModeType) => {
    setCurrentMode(mode);
    if (mode === "investigation") {
      loadInvestigationDemo();
    } else if (mode === "hiring") {
      loadHiringDemo();
    } else {
      loadDiaryDemo();
    }
  };

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

      // Update statements with cryptographic hash chain
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

      showNotification("Statement processed and appended to cryptographic narrative chain.");
    } catch (err: unknown) {
      console.error(err);
      showNotification(`Processing Error: ${err instanceof Error ? err.message : String(err)}`);
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
        showNotification(`Slot [${slot.toUpperCase()}] resolved successfully.`);
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
    showNotification(`New evidentiary record added: ${ev.source}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 shadow-lg">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Logo & Case Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
              title="Return to Cases"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20">
                PR
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-slate-100 line-clamp-1">
                    {caseTitle}
                  </h1>
                  <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700/60 px-2 py-0.5 rounded-full font-mono">
                    ID: {caseId.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>PRAMANA Unified Truth-Seeking Engine</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Selector Pill Tabs */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <ModeSelector
              currentMode={currentMode}
              onModeChange={handleModeChange}
              disabled={isProcessing}
            />

            {/* Quick Demo Switcher */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={loadInvestigationDemo}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                title="Load Investigation Demo Case"
              >
                Heist Case
              </button>
              <button
                onClick={loadHiringDemo}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                title="Load Hiring Reference Demo Case"
              >
                Hiring Case
              </button>
              <button
                onClick={loadDiaryDemo}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                title="Load Reflective Diary Demo Case"
              >
                Diary Case
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Temporary Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 border border-amber-500/50 text-amber-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ============================================================ */}
        {/* LEFT COLUMN: TIMELINE & CRYPTOGRAPHIC AUDIT (Cols 1-3)       */}
        {/* ============================================================ */}
        <section className="lg:col-span-3 space-y-4 flex flex-col">
          {/* SHA-256 Hash Chain Integrity Status */}
          <HashChainStatus statements={statements} />

          {/* Chronological Event Timeline & React Flow Graph */}
          <div className="flex-1">
            <Timeline
              claims={claims}
              evidenceList={evidenceList}
              findings={findings}
            />
          </div>
        </section>

        {/* ============================================================ */}
        {/* CENTER COLUMN: CLAIM WORKSPACE (Cols 4-8)                     */}
        {/* ============================================================ */}
        <section className="lg:col-span-5 space-y-4 flex flex-col">
          {/* Statement Submission Input */}
          <StatementInput
            onSubmit={handleStatementSubmit}
            isLoading={isProcessing}
            defaultNarrator={
              statements.length > 0 ? statements[statements.length - 1].narrator : ""
            }
          />

          {/* Clarification Gate (Only shows if required slots are missing) */}
          <ClarificationGate
            unresolvedSlots={unresolvedSlots}
            clarificationQuestion={clarificationQuestion}
            onResolve={handleResolveClarification}
            isLoading={isProcessing}
          />

          {/* Extracted Atomic Claims List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Extracted Atomic Claims
                </h3>
                <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-mono font-semibold">
                  {claims.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Mode: <span className="font-semibold text-slate-300 capitalize">{currentMode}</span>
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[580px] pr-1">
              {claims.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No claims extracted yet. Enter a statement above or load a demo case.
                </div>
              ) : (
                claims.map((claim, idx) => (
                  <ClaimCard
                    key={claim.id || idx}
                    claim={claim}
                    index={idx}
                    highlighted={claim.status === "disputed"}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: COACH, FINDINGS & AUDIT RECORDS (Cols 9-12)    */}
        {/* ============================================================ */}
        <section className="lg:col-span-4 space-y-4 flex flex-col">
          {/* Cognitive Interview Coach Panel */}
          <CoachPanel
            coachQuestion={coachQuestion}
            onUseQuestion={(q) => showNotification(`Copied question to clipboard: "${q}"`)}
          />

          {/* Structured Evidentiary Findings */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Evidentiary Findings & Anomaly Flags
                </h3>
              </div>
              <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-800/80 px-2 py-0.5 rounded-full font-mono font-bold">
                {findings.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {findings.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No contradictions or timeline gaps detected.
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
                      showNotification(`Finding updated to: ${status}`);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Verified Evidence Logs Table */}
          <EvidenceTable
            evidenceList={evidenceList}
            onAddEvidence={handleAddEvidence}
          />

          {/* Real-Time Agent Execution Activity */}
          <AgentActivity logs={logs} isExecuting={isProcessing} />
        </section>
      </main>
    </div>
  );
}
