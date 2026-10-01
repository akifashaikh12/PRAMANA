"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Language, TRANSLATIONS, TranslationKey } from "@/locales/translations";

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => TRANSLATIONS.en[key],
});

const STORAGE_KEY = "pramana-lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  // Restore persisted locale after mount (lazy initializer would run during SSR).
  // setTimeout is used instead of requestAnimationFrame because rAF never fires
  // in occluded/hidden tabs, which would leave the UI on the default language.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
        if (stored === "en" || stored === "hi" || stored === "gu") {
          setLangState(stored);
        }
      } catch {
        /* storage unavailable — keep default */
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Keep <html lang> in sync for a11y and font rendering
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
