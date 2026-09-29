import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Briefcase,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  GitBranch,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const modes = [
    {
      id: "investigation",
      caseId: "meridian-intrusion",
      title: "Forensic Investigation",
      subtitle: "The Meridian Vault & Server Room Intrusion",
      tagline: "Minute Precision • Non-Leading Guardrails • Physical Access Logs",
      description:
        "High-stakes factual inquiry that decomposes witness statements into atomic claims, flags unanchored times, cross-checks against badge/CCTV logs, and detects timeline gaps.",
      icon: ShieldAlert,
      badge: "Minute Precision",
      color: "from-amber-500/20 to-rose-500/20 text-amber-400 border-amber-500/40",
      buttonColor: "bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold",
    },
    {
      id: "hiring",
      caseId: "principal-architect-hiring",
      title: "Candidate Reference & Verification",
      subtitle: "Principal Distributed Systems Architect Reference",
      tagline: "Day Precision • Ownership Attribution • Scope Dispute Detection",
      description:
        "Examines resume tenure claims and reference statements against corporate SEC filings and repository commit logs without declaring automated hiring verdicts.",
      icon: Briefcase,
      badge: "Day Precision",
      color: "from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/40",
      buttonColor: "bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold",
    },
    {
      id: "diary",
      caseId: "1994-lake-trip-diary",
      title: "Reflective Memory & Personal Diary",
      subtitle: "1994 Summer Lake Cabin Trip Recollection",
      tagline: "Hour Precision • Preserves Uncertainty • Disputed Perspectives",
      description:
        "Warm, empathetic narrative processing that honors differing subjective recollections between family members without imposing a single winner.",
      icon: BookOpen,
      badge: "Hour Precision",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40",
      buttonColor: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-lg shadow-amber-500/20">
              PR
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                PRAMANA
              </span>
              <span className="ml-2 text-xs font-mono text-slate-400">
                v1.0 • Stateful Agentic Truth Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>SHA-256 Hash Chain</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>LangGraph.js + Llama 3.3 70B</span>
            </div>
            <Link
              href="/case/new"
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
            >
              New Case
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 flex flex-col justify-center space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>One Core Agentic Engine • Three Distinct Modes</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-100">
            Atomic Claim Extraction, Verification & Cognitive Inquiries
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            PRAMANA extracts atomic falsifiable claims from narrative statements,
            flags ambiguous slots, detects spatial & temporal conflicts against evidentiary logs,
            and dynamically formulates next-best non-leading questions.
          </p>
        </div>

        {/* 3 Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-amber-500/5 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-3 rounded-2xl bg-gradient-to-br ${mode.color} border`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-slate-950 px-2.5 py-1 rounded-full text-slate-400 border border-slate-800">
                      {mode.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                      {mode.title}
                    </h3>
                    <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                      {mode.subtitle}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      {mode.tagline}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {mode.description}
                  </p>
                </div>

                <div className="pt-6">
                  <Link
                    href={`/case/${mode.caseId}`}
                    className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-md ${mode.buttonColor}`}
                  >
                    <span>Launch {mode.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Architectural Highlights Banner */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>SHA-256 Hash Chain</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every statement is cryptographically bound:{" "}
              <code className="text-[10px] font-mono bg-slate-950 px-1 py-0.5 rounded text-amber-300">
                SHA256(prevHash + narrator + body + createdAt)
              </code>
              , preventing retroactive testimony manipulation.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <GitBranch className="w-4 h-4" />
              <span>LangGraph.js Pipeline</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic slot checking and conflict evaluation married with ChatGroq
              Llama 3.3 for structured claim parsing and open-ended inquiry generation.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Deterministic Auditing</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pure TypeScript tools for relative time normalization, spatial colocation
              verification, and unaccounted timeline gap detection.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Question Linter</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforces cognitive interview guidelines. Prohibits accusatory or leading
              questions and automatically rewrites inquiries into neutral forms.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>
          PRAMANA Architecture • Designed for Forensic Investigations, Reference Verification & Memory Preservation
        </p>
      </footer>
    </div>
  );
}
