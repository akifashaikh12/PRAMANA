"use client";

import React, { useMemo, useState } from "react";
import { Database, Plus, Search, MapPin } from "lucide-react";
import { Evidence } from "@/agent/schemas";
import { useI18n } from "@/locales/i18n-context";
import { useTranslatedPayload } from "@/locales/translated-payload";
import { EVIDENCE_KIND_LABEL_KEYS, BCP47_LOCALES } from "@/locales/translations";
import type { TranslationKey } from "@/locales/translations";

interface EvidenceTableProps {
  evidenceList: Evidence[];
  onAddEvidence?: (evidence: Evidence) => void;
}

export function EvidenceTable({ evidenceList, onAddEvidence }: EvidenceTableProps) {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState("");

  // Display-only translation of the WHOLE evidence ledger in one batched
  // object request when the language changes (descriptions, sources, places,
  // photo captions, resume-parsed facts). Originals stay verbatim — the
  // SHA-256 audit chain is untouched. Falls back to originals on failure.
  const evidencePayload = useMemo(
    () =>
      evidenceList.map((e) => ({
        id: e.id,
        description: e.description,
        source: e.source,
        place: e.place,
      })),
    [evidenceList]
  );
  const { data: translatedEvidence } = useTranslatedPayload(evidencePayload, lang);

  const translatedFor = (id: string) =>
    translatedEvidence?.find((e) => e?.id === id) ?? null;

  const kindLabel = (kind: string) => {
    const key: TranslationKey | undefined = EVIDENCE_KIND_LABEL_KEYS[kind];
    return key ? t(key) : kind.replace("_", " ");
  };
  const [isAdding, setIsAdding] = useState(false);

  // New evidence form state
  const [kind, setKind] = useState("badge_swipe");
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState("");
  const [timestamp, setTimestamp] = useState(() => new Date().toISOString().slice(0, 16));
  const [source, setSource] = useState("");

  const kindOptions: { value: string; labelKey: TranslationKey }[] = [
    { value: "badge_swipe", labelKey: "kind_badge_swipe" },
    { value: "cctv_log", labelKey: "kind_cctv_log" },
    { value: "wifi_telemetry", labelKey: "kind_wifi_telemetry" },
    { value: "toll_receipt", labelKey: "kind_toll_receipt" },
    { value: "phone_record", labelKey: "kind_phone_record" },
    { value: "witness_statement", labelKey: "kind_witness_statement" },
    { value: "photo", labelKey: "kind_photo" },
    { value: "resume", labelKey: "kind_resume" },
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !onAddEvidence) return;

    onAddEvidence({
      id: `ev-manual-${Date.now()}`,
      kind,
      description: description.trim(),
      place: place.trim() || null,
      timestamp: new Date(timestamp).toISOString(),
      source: source.trim() || t("manual_entry_source"),
    });

    setDescription("");
    setPlace("");
    setSource("");
    setIsAdding(false);
  };

  const filtered = evidenceList.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.description.toLowerCase().includes(q) ||
      (e.place && e.place.toLowerCase().includes(q)) ||
      e.source.toLowerCase().includes(q) ||
      e.kind.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-success" />
          <h3 className="text-xs font-bold text-ink uppercase tracking-wide">
            {t("evidence_label")}
          </h3>
          <span className="text-xs bg-success-light text-success border border-success/20 px-2 py-0.5 rounded-full font-mono font-semibold">
            {evidenceList.length}
          </span>
        </div>

        {onAddEvidence && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="btn-secondary h-8 text-xs gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>{isAdding ? t("cancel") : t("add_record")}</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3 h-3 absolute left-3 top-2.5 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search_placeholder")}
          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>

      {/* Add New Record Form */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-sm"
        >
          <div className="font-semibold text-ink text-xs uppercase tracking-wide">
            {t("new_entry_title")}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted block mb-1">{t("field_kind")}</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {kindOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">{t("field_timestamp")}</label>
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">{t("field_description")}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("desc_placeholder")}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted block mb-1">{t("field_place")}</label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder={t("place_placeholder")}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">{t("field_source")}</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={t("source_placeholder")}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-2">
            {t("save_record")}
          </button>
        </form>
      )}

      {/* Evidence Table List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted">{t("no_evidence")}</div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-sm space-y-1 transition-colors"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase bg-success-light text-success border border-success/20 px-1.5 py-0.5 rounded font-semibold">
                  {kindLabel(item.kind)}
                </span>
                <span className="text-xs text-muted font-mono">
                  {new Date(item.timestamp).toLocaleString(BCP47_LOCALES[lang], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="text-sm text-ink font-medium">
                {translatedFor(item.id)?.description ?? item.description}
              </p>

              <div className="flex items-center justify-between text-xs text-muted">
                {item.place && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{translatedFor(item.id)?.place ?? item.place}</span>
                  </span>
                )}
                <span className="italic">
                  {t("via_source")} {translatedFor(item.id)?.source ?? item.source}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
