"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Globe, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/i18n-context";
import type { TranslationKey } from "@/locales/translations";

export type SupportedLanguage = "auto" | "en" | "hi" | "gu";

interface VoiceInputProps {
  onTranscribe: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscribe, disabled = false }: VoiceInputProps) {
  const { t } = useI18n();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>("auto");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const getSupportedMimeType = (): string | undefined => {
    if (typeof window === "undefined" || !window.MediaRecorder) return undefined;
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/wav",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return undefined;
  };

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        await handleUpload(finalBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error("Microphone access error:", err);
      setErrorMessage(err instanceof Error ? err.message : t("mic_denied"));
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping MediaRecorder:", err);
      }
      setIsRecording(false);
    }
  };

  const handleUpload = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "speech.webm");
      formData.append("language", selectedLang);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Voice transcription failed.");
      }

      if (data.text && data.text.trim()) {
        onTranscribe(data.text.trim());
      } else {
        setErrorMessage(t("no_speech"));
      }
    } catch (err: unknown) {
      console.error("Voice transcription error:", err);
      setErrorMessage(err instanceof Error ? err.message : t("transcribe_failed"));
    } finally {
      setIsTranscribing(false);
      setRecordingDuration(0);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const langOptions: { value: SupportedLanguage; label: TranslationKey | string }[] = [
    { value: "auto", label: t("auto_detect") },
    { value: "en", label: "English" },
    { value: "hi", label: "हिन्दी" },
    { value: "gu", label: "ગુજરાતી" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <div className="flex items-center gap-2">
        {/* Multi-Lingual Selector */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm shadow-sm">
          <Globe className="w-3.5 h-3.5 text-accent" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as SupportedLanguage)}
            disabled={isRecording || isTranscribing || disabled}
            className="bg-transparent text-ink text-xs outline-none cursor-pointer pr-1 focus:ring-0"
            title={t("speech_language")}
          >
            {langOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Record Toggle / Transcribe Button */}
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isTranscribing || disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all shadow-sm cursor-pointer",
              isTranscribing
                ? "bg-accent-muted text-accent border-accent-light"
                : "bg-white hover:bg-slate-50 text-ink border-slate-200 hover:border-accent/40"
            )}
            title={t("record_tooltip")}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>{t("transcribing")}</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-accent" />
                <span>{t("voice_input")}</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger-light border border-danger/40 text-danger text-xs font-semibold hover:bg-danger/10 transition-all cursor-pointer"
              title={t("stop_recording")}
            >
              <Square className="w-3 h-3 fill-danger" />
              <span>{t("stop_recording")}</span>
            </button>

            {/* Live Timer Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-danger/30 rounded-lg text-danger font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
              <span>{formatTimer(recordingDuration)}</span>
              <div className="flex items-center gap-0.5 ml-1">
                <span className="w-1 h-2 bg-danger/70 animate-pulse" />
                <span className="w-1 h-3 bg-danger/70 animate-pulse" />
                <span className="w-1 h-2 bg-danger/70 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-danger bg-danger-light border border-danger/20 px-2 py-1 rounded-lg">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span className="line-clamp-1">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
