"use client";

import React, { useState, useRef } from "react";
import {
  Send,
  User,
  Calendar,
  Sparkles,
  Loader2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  X,
} from "lucide-react";
import { VoiceInput } from "./voice-input";
import { CameraCapture, CapturedPhoto } from "./camera-capture";
import { Evidence, ExtractedClaim } from "@/agent/schemas";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/i18n-context";

export type InputMode = "investigation" | "hiring" | "diary";

interface StatementInputProps {
  onSubmit: (data: {
    narrator: string;
    statement: string;
    statementDate: string;
  }) => Promise<void>;
  /** Diary/Hiring/Investigation attachments become evidence records. */
  onAddEvidence?: (evidence: Evidence) => void;
  /** Resume uploads can inject extracted claims directly. */
  onAddClaims?: (claims: ExtractedClaim[], fileName: string) => void;
  isLoading?: boolean;
  defaultNarrator?: string;
  mode?: InputMode;
}

interface PendingAttachment {
  id: string;
  name: string;
  size: number;
  file: File;
  previewUrl?: string;
}

export function StatementInput({
  onSubmit,
  onAddEvidence,
  onAddClaims,
  isLoading = false,
  defaultNarrator = "",
  mode = "investigation",
}: StatementInputProps) {
  const { t } = useI18n();
  const [narrator, setNarrator] = useState(defaultNarrator);
  const [statement, setStatement] = useState("");
  const [statementDate, setStatementDate] = useState(
    () => new Date().toISOString().slice(0, 16)
  );
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isResumeParsing, setIsResumeParsing] = useState(false);
  const [resumeStatus, setResumeStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const acceptsForMode = (): string => {
    switch (mode) {
      case "diary":
        return "image/png,image/jpeg,.pdf";
      case "hiring":
        return ".pdf,.doc,.docx";
      default:
        return ".pdf,.doc,.docx,image/png,image/jpeg,text/plain,.csv";
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: PendingAttachment[] = Array.from(files).map((f) => ({
      id: `att-${f.name}-${f.size}-${f.lastModified}`,
      name: f.name,
      size: f.size,
      file: f,
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setAttachments((prev) => [...prev, ...next]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  /** Convert an image attachment into an evidence record (verbatim filename preserved). */
  const attachmentToEvidence = (att: PendingAttachment, capturedAt?: string): Evidence => ({
    id: `ev-${att.id}`,
    kind: att.file.type.startsWith("image/") ? "photo" : "document",
    description: `${t("attachment_evidence")}: ${att.name}`,
    place: null,
    timestamp: capturedAt ?? new Date(statementDate).toISOString(),
    source: att.name,
  });

  const handleResumeUpload = async (file: File) => {
    setIsResumeParsing(true);
    setResumeStatus(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t("resume_parse_failed"));
      }

      const claims = (json.claims ?? []) as ExtractedClaim[];
      onAddClaims?.(claims, file.name);
      setResumeStatus(
        claims.length > 0
          ? `${t("resume_extracted_prefix")} ${claims.length} ${t("resume_extracted_suffix")}`
          : t("resume_no_claims")
      );
    } catch (err: unknown) {
      console.error("Resume upload error:", err);
      setResumeStatus(err instanceof Error ? err.message : t("resume_parse_failed"));
    } finally {
      setIsResumeParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim() || isLoading) return;

    await onSubmit({
      narrator: narrator.trim() || "Anonymous",
      statement: statement.trim(),
      statementDate: new Date(statementDate).toISOString(),
    });

    // Flush pending attachments to the evidence ledger AFTER the statement runs.
    if (onAddEvidence && attachments.length > 0) {
      attachments.forEach((att) => onAddEvidence(attachmentToEvidence(att)));
      attachments.forEach((att) => {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
      setAttachments([]);
    }
    setStatement("");
    setResumeStatus(null);
  };

  const handleQuickInsert = (text: string, speaker: string) => {
    setNarrator(speaker);
    setStatement(text);
  };

  const handleVoiceTranscribe = (transcribedText: string) => {
    setStatement((prev) =>
      prev.trim() ? `${prev.trim()} ${transcribedText}` : transcribedText
    );
  };

  const handleCameraCapture = (photo: CapturedPhoto) => {
    if (!onAddEvidence) return;
    // The captured frame itself stays in browser memory; the evidence record
    // references it verbatim (timestamped) without mutating any stored text.
    onAddEvidence({
      id: `ev-cam-${photo.capturedAt}`,
      kind: "photo",
      description: `${t("camera_evidence")} ${photo.capturedAt}`,
      place: null,
      timestamp: photo.capturedAt,
      source: t("camera_source"),
    });
  };

  const showCamera = mode === "investigation";
  const showResumeUpload = mode === "hiring";
  const showFileAttach = mode === "diary" || mode === "investigation";

  const modePresets: { text: string; speaker: string; labelKey: "alibi_preset" | "ambiguous_preset" }[] =
    mode === "investigation"
      ? [
          {
            text: "I arrived at the headquarters at 1:45 PM. I stayed in the first-floor main lobby having coffee until 2:30 PM. I never went near the basement or the server vault. Later that evening around 6:00 PM, I met Sarah for dinner across town.",
            speaker: "Marcus Vance",
            labelKey: "alibi_preset",
          },
          {
            text: "Someone was hanging around somewhere near the corridor yesterday afternoon, but I don't recall who it was.",
            speaker: "Witness B",
            labelKey: "ambiguous_preset",
          },
        ]
      : mode === "hiring"
      ? [
          {
            text: "I served as Principal Distributed Systems Architect at Nexus Corp from March 2021 to December 2023, and I independently designed and executed the 100k QPS ledger migration in 2022.",
            speaker: "Elena Rostova",
            labelKey: "alibi_preset",
          },
          {
            text: "Our team delivered the migration, though I personally reviewed the architecture and authored the RFC alongside the tech lead.",
            speaker: "Elena Rostova",
            labelKey: "ambiguous_preset",
          },
        ]
      : [
          {
            text: "Yesterday around 4 PM we reached the lake cabin. I remember Dad starting the grill near the porch while I unpacked inside.",
            speaker: "Aisha",
            labelKey: "alibi_preset",
          },
          {
            text: "I think it might have been raining sometime that afternoon, but I am not sure exactly when.",
            speaker: "Rohan",
            labelKey: "ambiguous_preset",
          },
        ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-4"
    >
      {/* Top Controls: Narrator, Date & Voice Assistant */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={narrator}
              onChange={(e) => setNarrator(e.target.value)}
              placeholder={t("narrator_placeholder")}
              disabled={isLoading}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="datetime-local"
              value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)}
              disabled={isLoading}
              className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
            />
          </div>
        </div>

        <div className="shrink-0">
          <VoiceInput onTranscribe={handleVoiceTranscribe} disabled={isLoading} />
        </div>
      </div>

      {/* Main Narrative Textarea */}
      <div className="relative">
        <textarea
          rows={3}
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder={t("statement_placeholder")}
          disabled={isLoading}
          className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none leading-relaxed"
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted">
          {statement.length} {t("chars_suffix")}
        </div>
      </div>

      {/* Domain-specific attachment zone */}
      <div className="flex flex-wrap items-center gap-2">
        {showFileAttach && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptsForMode()}
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold bg-white hover:bg-slate-50 text-ink border-slate-200 hover:border-accent/40 transition-all shadow-sm cursor-pointer"
              title={mode === "diary" ? t("attach_diary_tooltip") : t("attach_forensic_tooltip")}
            >
              <Paperclip className="w-3.5 h-3.5 text-accent" />
              <span>{mode === "diary" ? t("attach_photos_files") : t("attach_evidence_files")}</span>
            </button>
          </>
        )}

        {showResumeUpload && (
          <label
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold shadow-sm transition-all",
              isResumeParsing
                ? "bg-accent-muted text-accent border-accent-light"
                : "bg-white hover:bg-slate-50 text-ink border-slate-200 hover:border-accent/40 cursor-pointer"
            )}
            title={t("resume_tooltip")}
          >
            {isResumeParsing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>{t("resume_parsing")}</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>{t("upload_resume")}</span>
              </>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              disabled={isResumeParsing || isLoading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleResumeUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        )}

        {showCamera && <CameraCapture onCapture={handleCameraCapture} disabled={isLoading} />}
      </div>

      {resumeStatus && (
        <div className="flex items-center gap-1.5 text-xs text-accent bg-accent-muted border border-accent-light px-2 py-1.5 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{resumeStatus}</span>
        </div>
      )}

      {/* Pending attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 pl-2 pr-1 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              {att.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="w-8 h-8 rounded object-cover border border-slate-200"
                />
              ) : (
                <ImageIcon className="w-4 h-4 text-muted" />
              )}
              <span className="max-w-[140px] truncate text-ink font-medium">{att.name}</span>
              <span className="text-muted font-mono">{Math.round(att.size / 1024)} KB</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="p-1 rounded hover:bg-slate-200 text-muted hover:text-danger transition-colors cursor-pointer"
                title={t("remove_attachment")}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer Controls: Quick Presets & Submit */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Sparkles className="w-3 h-3 text-accent" />
          <span className="hidden sm:inline">{t("try_preset")}</span>
          {modePresets.map((preset) => (
            <button
              key={preset.labelKey}
              type="button"
              onClick={() => handleQuickInsert(preset.text, preset.speaker)}
              className={cn(
                "text-xs px-2 py-1 rounded-lg border transition-colors cursor-pointer",
                preset.labelKey === "alibi_preset"
                  ? "bg-slate-100 hover:bg-slate-200 text-ink-secondary border-slate-200"
                  : "bg-accent-muted hover:bg-accent-light text-accent border-accent-light"
              )}
            >
              {t(preset.labelKey)}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!statement.trim() || isLoading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
            statement.trim() && !isLoading
              ? "bg-accent hover:bg-accent-hover text-white shadow-sm active:scale-[0.98] cursor-pointer"
              : "bg-slate-100 text-muted border border-slate-200 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("loading")}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{t("submit_engine")}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
