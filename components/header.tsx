"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Lock, Cpu, ChevronDown } from "lucide-react";
import { LANGUAGES, Language } from "@/locales/translations";
import { useI18n } from "@/locales/i18n-context";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** Compact variant for the case workspace page (back arrow + small badges). */
  variant?: "full" | "compact";
  caseTitle?: string;
  caseId?: string;
}

export function Header({ variant = "full", caseTitle, caseId }: HeaderProps) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const LanguageSwitcher = (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn-secondary h-8 px-2 text-xs gap-1"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t("switch_language")}
      >
        <Globe className="w-3.5 h-3.5 text-accent" />
        <span>{current.native}</span>
        <ChevronDown className="w-3 h-3 text-muted" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === lang}
              onClick={() => {
                setLang(l.code as Language);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors cursor-pointer",
                l.code === lang
                  ? "bg-accent-muted text-accent font-semibold"
                  : "text-ink hover:bg-slate-50"
              )}
            >
              <span>{l.native}</span>
              <span className="text-[10px] font-mono text-muted uppercase">{l.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (variant === "compact") {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-[1720px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-ink-secondary border border-slate-200 transition-colors"
              title={t("back_to_cases")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center text-xs font-bold shrink-0">
              PR
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-ink truncate leading-tight">
                {caseTitle ?? t("app_name")}
              </h1>
              {caseId && (
                <span className="text-xs text-muted font-mono">
                  {t("case_id_label")}: {caseId.slice(0, 8)}
                </span>
              )}
            </div>
          </div>
          {LanguageSwitcher}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center text-xs font-bold">
            PR
          </div>
          <div>
            <span className="font-bold text-base text-ink tracking-tight">
              {t("app_name")}
            </span>
            <span className="ml-2 text-xs text-muted hidden sm:inline">
              {t("app_suffix")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-success" />
              {t("hash_chain_badge")}
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-accent" />
              {t("langgraph_badge")}
            </span>
          </div>
          {LanguageSwitcher}
          <Link href="/case/new" className="btn-primary h-8 text-xs">
            {t("new_case")}
          </Link>
        </div>
      </div>
    </header>
  );
}
