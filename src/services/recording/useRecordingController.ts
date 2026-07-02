"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addRecordingMarker,
  cancelRecording,
  getElapsedMs,
  isRecordingSupported,
  pauseRecording,
  requestMicrophonePermission,
  resumeRecording,
  startRecording,
  stopRecording,
  type RecordingStatus,
} from "./recordingService";
import type { AudioMode, MarkerType } from "@/types/lecture";

export type RecordingController = {
  status: RecordingStatus;
  elapsedMs: number;
  markers: { type: MarkerType; label: string; timeMs: number }[];
  error: string | null;
  supported: boolean;
  start: (audioMode: AudioMode) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<{ blob: Blob; mimeType: string; durationMs: number; markers: { type: MarkerType; label: string; timeMs: number }[] }>;
  addMarker: (type: MarkerType, label: string) => void;
  cancel: () => void;
};

export function useRecordingController(): RecordingController {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [markers, setMarkers] = useState<{ type: MarkerType; label: string; timeMs: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supported = isRecordingSupported();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedMs(getElapsedMs());
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async (audioMode: AudioMode) => {
    setError(null);
    setStatus("requesting_permission");
    try {
      const stream = await requestMicrophonePermission();
      startRecording(stream, audioMode);
      setStatus("recording");
      startTimer();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "マイクへのアクセスが拒否されました。");
    }
  }, [startTimer]);

  const pause = useCallback(() => {
    pauseRecording();
    setStatus("paused");
    stopTimer();
  }, [stopTimer]);

  const resume = useCallback(() => {
    resumeRecording();
    setStatus("recording");
    startTimer();
  }, [startTimer]);

  const stop = useCallback(async () => {
    stopTimer();
    setStatus("finalizing");
    try {
      const result = await stopRecording();
      setElapsedMs(result.durationMs);
      setMarkers(result.markers.map((m) => ({ ...m, type: m.type as MarkerType })));
      setStatus("idle");
      return { ...result, markers: result.markers.map((m) => ({ ...m, type: m.type as MarkerType })) };
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "録音の停止に失敗しました。");
      throw err;
    }
  }, [stopTimer]);

  const addMarker = useCallback((type: MarkerType, label: string) => {
    addRecordingMarker(type, label);
    const ms = getElapsedMs();
    setMarkers((prev) => [...prev, { type, label, timeMs: ms }]);
  }, []);

  const cancel = useCallback(() => {
    stopTimer();
    cancelRecording();
    setStatus("idle");
    setElapsedMs(0);
    setMarkers([]);
  }, [stopTimer]);

  return { status, elapsedMs, markers, error, supported, start, pause, resume, stop, addMarker, cancel };
}
