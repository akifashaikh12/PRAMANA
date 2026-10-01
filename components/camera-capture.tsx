"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useI18n } from "@/locales/i18n-context";
import { cn } from "@/lib/utils";

export interface CapturedPhoto {
  /** data:image/jpeg;base64,... — display/caption use; original bytes are never mutated */
  dataUrl: string;
  capturedAt: string;
}

interface CameraCaptureProps {
  /** Called for each snapped photo. Caller stores the blob reference only. */
  onCapture: (photo: CapturedPhoto) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled = false }: CameraCaptureProps) {
  const { t } = useI18n();
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingUser, setFacingUser] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  // Always release the camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setErrorMessage(null);
    setIsStarting(true);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error(t("camera_unsupported"));
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingUser ? "user" : "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setErrorMessage(
        err instanceof Error && err.name === "NotAllowedError"
          ? t("camera_denied")
          : t("camera_unavailable")
      );
    } finally {
      setIsStarting(false);
    }
  };

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    setIsSnapping(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      onCapture({
        dataUrl,
        capturedAt: new Date().toISOString(),
      });
    } finally {
      setIsSnapping(false);
    }
  };

  const flipCamera = () => {
    setFacingUser((prev) => !prev);
    // Restart the stream with the new facing mode
    stopStream();
    setTimeout(() => {
      void startCamera();
    }, 100);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => {
          if (isActive) {
            stopStream();
          } else {
            void startCamera();
          }
        }}
        disabled={disabled || isStarting}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all shadow-sm cursor-pointer",
          isActive
            ? "bg-danger-light border-danger/40 text-danger hover:bg-danger/10"
            : "bg-white hover:bg-slate-50 text-ink border-slate-200 hover:border-accent/40"
        )}
        title={isActive ? t("camera_close") : t("camera_open")}
      >
        {isStarting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>{t("camera_starting")}</span>
          </>
        ) : isActive ? (
          <>
            <X className="w-3.5 h-3.5" />
            <span>{t("camera_close")}</span>
          </>
        ) : (
          <>
            <Camera className="w-3.5 h-3.5 text-accent" />
            <span>{t("camera_capture")}</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-danger bg-danger-light border border-danger/20 px-2 py-1 rounded-lg">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span className="line-clamp-2">{errorMessage}</span>
        </div>
      )}

      {isActive && (
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-950 relative">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full aspect-video object-cover"
          />
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={flipCamera}
              className="p-2 rounded-full bg-white/90 hover:bg-white text-ink shadow-sm transition-colors cursor-pointer"
              title={t("camera_flip")}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={snapPhoto}
              disabled={isSnapping}
              className="p-3 rounded-full bg-accent hover:bg-accent-hover text-white shadow-md transition-colors cursor-pointer disabled:opacity-60"
              title={t("camera_snap")}
            >
              {isSnapping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
