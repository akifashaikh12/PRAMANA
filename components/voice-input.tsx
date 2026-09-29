"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Globe, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SupportedLanguage = "auto" | "en" | "hi" | "gu";

interface VoiceInputProps {
  onTranscribe: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscribe, disabled = false }: VoiceInputProps) {
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
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
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

      mediaRecorder.start(250); // collect 250ms chunks
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error("Microphone access error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Microphone permission denied or audio device unavailable."
      );
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
        setErrorMessage("No clear speech was detected in the recording.");
      }
    } catch (err: unknown) {
      console.error("Voice transcription error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Transcription request failed. Check GROQ_API_KEY."
      );
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

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <div className="flex items-center gap-2">
        {/* Multi-Lingual Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1 text-xs shadow-inner">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as SupportedLanguage)}
            disabled={isRecording || isTranscribing || disabled}
            className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer pr-1 focus:ring-0"
            title="Speech Recognition Language"
          >
            <option value="auto" className="bg-slate-900 text-slate-200">
              Auto-Detect
            </option>
            <option value="en" className="bg-slate-900 text-slate-200">
              English
            </option>
            <option value="hi" className="bg-slate-900 text-slate-200">
              Hindi (हिंदी)
            </option>
            <option value="gu" className="bg-slate-900 text-slate-200">
              Gujarati (ગુજરાતી)
            </option>
          </select>
        </div>

        {/* Record Toggle / Transcribe Button */}
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isTranscribing || disabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer",
              isTranscribing
                ? "bg-slate-900 text-amber-300 border-amber-500/40"
                : "bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40 hover:border-emerald-500/60 shadow-emerald-950/30"
            )}
            title="Record speech from microphone"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Transcribing Whisper v3...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voice Input</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs font-semibold hover:bg-rose-900/80 transition-all shadow-lg shadow-rose-950/50 cursor-pointer animate-pulse"
              title="Stop recording"
            >
              <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
              <span>Stop Recording</span>
            </button>

            {/* Live Audio Waveform & Timer Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-rose-500/40 rounded-lg text-rose-400 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{formatTimer(recordingDuration)}</span>
              <div className="flex items-center gap-0.5 ml-1">
                <span className="w-1 h-2 bg-rose-400 animate-pulse" />
                <span className="w-1 h-3.5 bg-rose-400 animate-pulse delay-75" />
                <span className="w-1 h-2 bg-rose-400 animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose-950/50 border border-rose-800/60 px-2 py-0.5 rounded-lg">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span className="line-clamp-1">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
