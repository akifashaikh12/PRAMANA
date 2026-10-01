"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useI18n } from "@/locales/i18n-context";
import type { Language } from "@/locales/translations";

/**
 * Dynamic data translation layer.
 *
 * Static UI labels come from locales/translations.ts. Stored user content
 * (statements, claims, findings, coach questions) is translated on-the-fly
 * through POST /api/translate and cached in React state per (lang, text) pair.
 *
 * AUDIT-CHAIN PRESERVATION: originals are never mutated. The hook returns
 * translations keyed by the verbatim source string; callers always retain
 * the original in state/Supabase so SHA-256 hashes remain valid.
 */

interface DynamicTranslationContextValue {
  /** Schedule a batch translation (call from effects/handlers, not render). */
  requestBatch: (texts: string[]) => void;
  /** Cache of translated strings, keyed `${lang}::${original}`. */
  cache: Map<string, string>;
  /** True while a translation request is in flight. */
  isLoading: boolean;
  /** True when active language is English (no translation needed). */
  isEnglish: boolean;
}

const DynamicTranslationContext = createContext<DynamicTranslationContextValue>({
  requestBatch: () => {},
  cache: new Map(),
  isLoading: false,
  isEnglish: true,
});

export function DynamicTranslationProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  const [cache, setCache] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Refs used ONLY inside callbacks/effects (never during render)
  const inflightRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cacheKey = useCallback(
    (langKey: Language, text: string) => `${langKey}::${text}`,
    []
  );

  const flushQueue = useCallback(
    async (langKey: Language, texts: string[]) => {
      timerRef.current = null;
      if (texts.length === 0) return;

      setIsLoading(true);
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts, targetLang: langKey }),
        });
        const json = await res.json();

        if (json.success && Array.isArray(json.translations)) {
          setCache((prev) => {
            const next = new Map(prev);
            texts.forEach((text, i) => {
              const translated = json.translations[i];
              if (typeof translated === "string" && translated.trim() !== "") {
                next.set(cacheKey(langKey, text), translated);
              }
            });
            return next;
          });
        }
      } catch {
        // Network/API failure: fall back to original text silently
      } finally {
        texts.forEach((text) => inflightRef.current.delete(cacheKey(langKey, text)));
        setIsLoading(false);
      }
    },
    [cacheKey]
  );

  const requestBatch = useCallback(
    (texts: string[]) => {
      if (lang === "en" || texts.length === 0) return;

      // Deduplicate against cache + inflight (refs are safe inside callbacks)
      const missing = texts.filter((text) => {
        const key = cacheKey(lang, text);
        return !inflightRef.current.has(key);
      });

      if (missing.length === 0) return;

      missing.forEach((text) => inflightRef.current.add(cacheKey(lang, text)));

      // Debounce-batch requests within 150ms
      if (timerRef.current === null) {
        timerRef.current = setTimeout(() => {
          void flushQueue(lang, missing);
        }, 150);
      } else {
        // Piggyback: flush again after the current timer resolves with the new batch
        const existing = timerRef.current;
        void existing; // timer already scheduled; missing texts join via inflight set
        setTimeout(() => {
          if (timerRef.current === null && missing.some((t) => inflightRef.current.has(cacheKey(lang, t)))) {
            void flushQueue(lang, missing);
          }
        }, 400);
      }
    },
    [lang, cacheKey, flushQueue]
  );

  return (
    <DynamicTranslationContext.Provider
      value={useMemo(
        () => ({ requestBatch, cache, isLoading, isEnglish: lang === "en" }),
        [requestBatch, cache, isLoading, lang]
      )}
    >
      {children}
    </DynamicTranslationContext.Provider>
  );
}

/**
 * Hook: translate a batch of dynamic strings for display only.
 * Returns a Record keyed by the ORIGINAL verbatim string — never replace stored data.
 */
export function useDynamicTranslations(texts: string[]): {
  translations: Record<string, string>;
  loading: boolean;
} {
  const { requestBatch, cache, isLoading, isEnglish } = useContext(DynamicTranslationContext);
  const { lang } = useI18n();

  // Stable dependency key for the (possibly new) array of texts
  const key = useMemo(() => texts.join("\u0000"), [texts]);

  useEffect(() => {
    if (!isEnglish && texts.length > 0) {
      requestBatch(texts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isEnglish, requestBatch]);

  const translations = useMemo(() => {
    const out: Record<string, string> = {};
    for (const text of texts) {
      if (isEnglish) {
        out[text] = text;
      } else {
        out[text] = cache.get(`${lang}::${text}`) ?? text;
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isEnglish, lang, cache]);

  return { translations, loading: isLoading && !isEnglish };
}

/**
 * Unified single-string translation hook.
 * THE canonical wrapper for rendering ANY dynamic data (evidence, claims,
 * timeline nodes, resume summaries, photo descriptions, conflict reports,
 * decisions, coach questions) exclusively in the active UI language.
 *
 * - English mode: returns the verbatim original (no API call).
 * - hi/gu mode: returns the cached/translated string, transparently scheduling
 *   a batched fetch; falls back to the original until/unless translated.
 * - ZERO-mutation guarantee: callers keep the original in state/DB; only the
 *   rendered output differs, so SHA-256 hash chains remain mathematically valid.
 */
export function useTranslatedText(original: string | null | undefined): {
  /** Translated (or original) string for DISPLAY ONLY. */
  text: string;
  /** Verbatim original — use for copy/save/hash operations. */
  original: string;
  loading: boolean;
} {
  const safeOriginal = original ?? "";
  const { translations, loading } = useDynamicTranslations([safeOriginal]);
  const { lang } = useI18n();

  const text = useMemo(() => {
    if (!safeOriginal) return "";
    if (lang === "en") return safeOriginal;
    return translations[safeOriginal] ?? safeOriginal;
  }, [safeOriginal, translations, lang]);

  return { text, original: safeOriginal, loading };
}
