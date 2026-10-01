"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Language } from "@/locales/translations";

/**
 * Simple deterministic string hash (FNV-1a) — used ONLY as a client cache key,
 * never for any audit purpose.
 */
function hashPayload(payload: unknown): string {
  const json = JSON.stringify(payload);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

interface CacheEntry<T> {
  data: T;
}

/** Module-level cache: payload-hash + language → translated payload. */
const payloadCache = new Map<string, CacheEntry<unknown>>();

/**
 * Translate a full dynamic payload (graph structures, conflict lists, coach
 * data, evidence records) into the active language via the object mode of
 * POST /api/translate. All rendering stays display-only: callers keep the
 * ORIGINAL payload in state/DB so SHA-256 hash chains stay valid.
 *
 * - English (or empty payload): returns the payload as-is, no request.
 * - hi/gu: serves from cache instantly on repeat renders; otherwise fetches
 *   the whole object translated in ONE batched request.
 * - On failure: falls back to the original payload (never blank UI).
 */
export function useTranslatedPayload<T>(payload: T, targetLanguage: Language): {
  data: T;
  isTranslating: boolean;
} {
  const [translatedPayload, setTranslatedPayload] = useState<T>(payload);
  const [isTranslating, setIsTranslating] = useState(false);
  const inFlightRef = useRef(false);

  // Stable signature for dependency tracking (identity-independent)
  const signature = useMemo(
    () => `${targetLanguage}:${hashPayload(payload)}`,
    [payload, targetLanguage]
  );
  const lastAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    // Already showing this exact (lang, payload) combination
    if (lastAppliedRef.current === signature) return;

    let isMounted = true;

    // Cache hit or trivial case: defer the state sync to a microtask so no
    // setState runs synchronously inside the effect body (React Compiler-safe).
    const applyDeferred = (data: T) => {
      lastAppliedRef.current = signature;
      Promise.resolve().then(() => {
        if (isMounted) {
          setTranslatedPayload(data);
          setIsTranslating(false);
        }
      });
    };

    if (!payload || targetLanguage === "en") {
      applyDeferred(payload);
      return () => {
        isMounted = false;
      };
    }

    const cached = payloadCache.get(signature);
    if (cached) {
      applyDeferred(cached.data as T);
      return () => {
        isMounted = false;
      };
    }

    // Cache miss: fetch the whole payload translated in ONE request
    if (!inFlightRef.current) {
      Promise.resolve().then(() => {
        if (isMounted) setIsTranslating(true);
      });
      inFlightRef.current = true;

      fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload, targetLanguage }),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (isMounted && resData && "translatedData" in resData && resData.translatedData) {
            payloadCache.set(signature, { data: resData.translatedData });
            lastAppliedRef.current = signature;
            setTranslatedPayload(resData.translatedData as T);
          }
        })
        .catch((err) => {
          console.error("Payload translation failed:", err);
          if (isMounted) setTranslatedPayload(payload);
        })
        .finally(() => {
          inFlightRef.current = false;
          if (isMounted) setIsTranslating(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [signature, payload, targetLanguage]);

  return { data: translatedPayload, isTranslating };
}
