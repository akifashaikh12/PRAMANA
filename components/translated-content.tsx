"use client";

import React from "react";
import { useDynamicTranslations } from "@/locales/dynamic-translation";
import { useI18n } from "@/locales/i18n-context";

interface TranslatedContentProps {
  /** Verbatim original string (never mutated — translations are display-only). */
  text: string;
  /** Optional override of the active UI language (defaults to context). */
  targetLang?: string;
  className?: string;
  as?: "span" | "p" | "div";
  /** Show a small title tooltip with the verbatim original for auditability. */
  showOriginalTitle?: boolean;
}

/**
 * Audit-integrity translation wrapper. Renders the given text translated into
 * the active UI language, fetching + caching through /api/translate. The
 * ORIGINAL string is what callers keep in state/DB; this component only ever
 * changes what is DISPLAYED, so SHA-256 hash chains remain valid.
 *
 * When translation is unavailable (e.g. GROQ_API_KEY not configured) or the
 * active language is English, the verbatim original renders unchanged.
 */
export function TranslatedContent({
  text,
  targetLang,
  className,
  as = "span",
  showOriginalTitle = true,
}: TranslatedContentProps) {
  const { lang } = useI18n();
  const activeLang = targetLang ?? lang;

  // Hook must run unconditionally; pass a stable single-element array.
  const { translations } = useDynamicTranslations([text]);
  const displayed = activeLang !== "en" ? (translations[text] ?? text) : text;

  const Tag = as;
  return (
    <Tag className={className} title={showOriginalTitle ? text : undefined}>
      {displayed}
    </Tag>
  );
}
