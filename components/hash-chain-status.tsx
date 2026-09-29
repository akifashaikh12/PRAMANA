"use client";

import React, { useState } from "react";
import { ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, Link as LinkIcon, Copy, Check } from "lucide-react";
import { StatementRecord } from "@/agent/schemas";
import { verifyHashChain } from "@/tools";
import { cn } from "@/lib/utils";

interface HashChainStatusProps {
  statements: StatementRecord[];
}

export function HashChainStatus({ statements }: HashChainStatusProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const verification = verifyHashChain(
    statements.map((s) => ({
      hash: s.hash,
      prev_hash: s.prev_hash,
      narrator: s.narrator,
      body: s.body,
      created_at: s.created_at || s.statement_date,
    }))
  );

  const handleCopy = (hashStr: string) => {
    navigator.clipboard.writeText(hashStr);
    setCopiedHash(hashStr);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const truncateHash = (hash: string) => {
    if (!hash || hash.length < 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const latestStatement = statements[statements.length - 1];

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 backdrop-blur-sm shadow-md">
      {/* Header Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {verification.valid ? (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>✓ SHA-256 Chain Valid</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-full text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>⚠ Chain Integrity Compromised</span>
            </div>
          )}
          <span className="text-[11px] text-slate-400 font-mono">
            ({verification.verifiedCount} {verification.verifiedCount === 1 ? "block" : "blocks"})
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-800 text-xs flex items-center gap-1"
          title="Toggle block details"
        >
          <span className="text-[11px]">{expanded ? "Hide" : "Audit"}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Latest Block Summary */}
      {latestStatement && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/70 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-slate-500" />
              <span>Latest Hash:</span>
            </span>
            <div className="flex items-center gap-1 font-mono text-slate-300">
              <span title={latestStatement.hash}>{truncateHash(latestStatement.hash)}</span>
              <button
                onClick={() => handleCopy(latestStatement.hash)}
                className="text-slate-500 hover:text-slate-300"
              >
                {copiedHash === latestStatement.hash ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Prev Link:</span>
            <span className="font-mono text-slate-400" title={latestStatement.prev_hash}>
              {truncateHash(latestStatement.prev_hash)}
            </span>
          </div>
        </div>
      )}

      {/* Detailed Chain Blocks Drawer */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 max-h-56 overflow-y-auto pr-1">
          {verification.chainDetails.map((block) => (
            <div
              key={block.index}
              className={cn(
                "p-2 rounded-lg text-[10px] font-mono border transition-all",
                block.isValid
                  ? "bg-slate-950/60 border-slate-800/90 text-slate-300"
                  : "bg-rose-950/30 border-rose-800/70 text-rose-300"
              )}
            >
              <div className="flex items-center justify-between font-semibold pb-1 border-b border-slate-800/50">
                <span className="text-slate-400">Block #{block.index}</span>
                <span className="text-slate-300 font-sans">{block.narrator}</span>
                <span className={block.isValid ? "text-emerald-400" : "text-rose-400"}>
                  {block.isValid ? "MATCH" : "TAMPER"}
                </span>
              </div>
              <div className="mt-1 space-y-0.5 text-slate-400">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hash:</span>
                  <span className="text-slate-300" title={block.hash}>
                    {truncateHash(block.hash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prev:</span>
                  <span className="text-slate-400" title={block.prevHash}>
                    {truncateHash(block.prevHash)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {!verification.valid && verification.error && (
            <div className="p-2 rounded bg-rose-950/50 border border-rose-800 text-[11px] text-rose-300">
              {verification.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
