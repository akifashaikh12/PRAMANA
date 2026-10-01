"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Copy,
  Check,
} from "lucide-react";
import { StatementRecord } from "@/agent/schemas";
import { verifyHashChain } from "@/tools";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/i18n-context";

interface HashChainStatusProps {
  statements: StatementRecord[];
}

export function HashChainStatus({ statements }: HashChainStatusProps) {
  const { t } = useI18n();
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
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4">
      {/* Header Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {verification.valid ? (
            <div className="flex items-center gap-1.5 text-success bg-success-light border border-success/20 px-2 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>✓ {t("hash_valid")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-danger bg-danger-light border border-danger/20 px-2 py-1 rounded-full text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>⚠ {t("hash_tampered")}</span>
            </div>
          )}
          <span className="text-xs text-muted font-mono">
            ({verification.verifiedCount}{" "}
            {verification.verifiedCount === 1 ? t("chain_block_singular") : t("chain_blocks")})
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted hover:text-ink transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 text-xs flex items-center gap-1 cursor-pointer"
          title="Toggle block details"
        >
          <span>{expanded ? t("hide") : t("audit_chain")}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Latest Block Summary */}
      {latestStatement && (
        <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between text-muted">
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              <span>{t("latest_hash_label")}</span>
            </span>
            <div className="flex items-center gap-1 font-mono text-ink">
              <span title={latestStatement.hash}>{truncateHash(latestStatement.hash)}</span>
              <button
                onClick={() => handleCopy(latestStatement.hash)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                {copiedHash === latestStatement.hash ? (
                  <Check className="w-3 h-3 text-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-muted">
            <span>{t("prev_hash_label")}</span>
            <span className="font-mono text-ink-secondary" title={latestStatement.prev_hash}>
              {truncateHash(latestStatement.prev_hash)}
            </span>
          </div>
        </div>
      )}

      {/* Detailed Chain Blocks Drawer */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 max-h-56 overflow-y-auto pr-1">
          {verification.chainDetails.map((block) => (
            <div
              key={block.index}
              className={cn(
                "p-2 rounded-lg text-xs font-mono border transition-all",
                block.isValid
                  ? "bg-slate-50 border-slate-200 text-ink-secondary"
                  : "bg-danger-light border-danger/30 text-danger"
              )}
            >
              <div className="flex items-center justify-between font-semibold pb-1 border-b border-slate-200">
                <span className="text-muted">Block #{block.index}</span>
                <span className="text-ink font-sans">{block.narrator}</span>
                <span className={block.isValid ? "text-success" : "text-danger"}>
                  {block.isValid ? t("match") : t("tampered")}
                </span>
              </div>
              <div className="mt-1 space-y-0.5 text-muted">
                <div className="flex justify-between">
                  <span>{t("hash_label")}</span>
                  <span className="text-ink-secondary" title={block.hash}>
                    {truncateHash(block.hash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("prev_short")}</span>
                  <span title={block.prevHash}>{truncateHash(block.prevHash)}</span>
                </div>
              </div>
            </div>
          ))}

          {!verification.valid && verification.error && (
            <div className="p-2 rounded-lg bg-danger-light border border-danger/30 text-xs text-danger">
              {verification.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
