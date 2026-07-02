import { useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";

export type RecorderState = "idle" | "recording" | "paused" | "stopping" | "failed";

export function useLectureRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef(0);
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => stopTimer(), []);

  const start = async () => {
    try {
      setError(null);
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) throw new Error("マイク権限がありません。講義を録音するにはマイクの使用を許可してください。");

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, shouldDuckAndroid: true });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      pausedElapsedRef.current = 0;
      startedAtRef.current = Date.now();
      setElapsedSec(0);
      setState("recording");
      startTimer();
    } catch (cause) {
      setState("failed");
      setError(cause instanceof Error ? cause.message : "録音開始に失敗しました。");
    }
  };

  const pause = async () => {
    try {
      const recording = recordingRef.current;
      if (!recording || state !== "recording") return;
      await recording.pauseAsync();
      pausedElapsedRef.current = elapsedSec;
      startedAtRef.current = null;
      stopTimer();
      setState("paused");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "一時停止に失敗しました。");
    }
  };

  const resume = async () => {
    try {
      const recording = recordingRef.current;
      if (!recording || state !== "paused") return;
      await recording.startAsync();
      startedAtRef.current = Date.now();
      setState("recording");
      startTimer();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "録音再開に失敗しました。");
    }
  };

  const stop = async () => {
    try {
      const recording = recordingRef.current;
      if (!recording) throw new Error("録音データが見つかりません。");

      setState("stopping");
      stopTimer();
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      startedAtRef.current = null;
      setState("idle");

      if (!uri) throw new Error("録音ファイルの保存先を取得できませんでした。");
      return { uri, durationSec: Math.max(1, elapsedSec) };
    } catch (cause) {
      setState("failed");
      setError(cause instanceof Error ? cause.message : "録音停止に失敗しました。");
      return null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      if (!startedAtRef.current) return;
      setElapsedSec(pausedElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 500);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  return { state, elapsedSec, error, start, pause, resume, stop, clearError: () => setError(null) };
}
