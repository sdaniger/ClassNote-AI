import type { AudioMode } from "@/types/lecture";

export type RecordingStatus = "idle" | "requesting_permission" | "recording" | "paused" | "finalizing" | "error";

export type MarkerTimestamp = {
  type: "confused" | "important" | "task";
  label: string;
  timeMs: number;
};

export type RecordingResult = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  markers: MarkerTimestamp[];
};

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function pickSupportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

let activeRecorder: MediaRecorder | null = null;
let activeStream: MediaStream | null = null;
let chunks: Blob[] = [];
let startTimeMs = 0;
let pausedAtMs = 0;
let totalPauseMs = 0;
let recordedMarkers: MarkerTimestamp[] = [];

export function isRecordingSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && typeof navigator !== "undefined" && Boolean(navigator.mediaDevices);
}

export async function requestMicrophonePermission(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("このブラウザはマイクにアクセスできません。");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } });
  return stream;
}

export function startRecording(stream: MediaStream, audioMode: AudioMode): void {
  const bitrate = audioMode === "opus_32k_high_quality" ? 32000 : audioMode === "opus_24k_readable" ? 24000 : audioMode === "opus_16k_standard" ? 16000 : 12000;
  const mimeType = pickSupportedMimeType();
  if (!mimeType) throw new Error("録音に対応する音声形式が見つかりません。");

  activeStream = stream;
  chunks = [];
  recordedMarkers = [];
  totalPauseMs = 0;

  const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: bitrate });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.start(1000);

  activeRecorder = recorder;
  startTimeMs = performance.now();
  pausedAtMs = 0;
}

export function pauseRecording(): void {
  if (!activeRecorder || activeRecorder.state !== "recording") return;
  activeRecorder.pause();
  pausedAtMs = performance.now();
}

export function resumeRecording(): void {
  if (!activeRecorder || activeRecorder.state !== "paused") return;
  activeRecorder.resume();
  totalPauseMs += performance.now() - pausedAtMs;
  pausedAtMs = 0;
}

export function getElapsedMs(): number {
  if (!activeRecorder) return 0;
  const now = performance.now();
  const pauseExtra = pausedAtMs > 0 ? now - pausedAtMs : 0;
  return Math.max(0, now - startTimeMs - totalPauseMs - pauseExtra);
}

export function addRecordingMarker(type: MarkerTimestamp["type"], label: string): void {
  recordedMarkers.push({ type, label, timeMs: getElapsedMs() });
}

export function getRecordingMarkers(): MarkerTimestamp[] {
  return [...recordedMarkers];
}

export function stopRecording(): Promise<RecordingResult> {
  return new Promise((resolve, reject) => {
    const recorder = activeRecorder;
    if (!recorder) return reject(new Error("録音が開始されていません。"));

    const durationMs = getElapsedMs();
    const mimeType = recorder.mimeType;
    const finalChunks = [...chunks];

    recorder.onstop = () => {
      const blob = new Blob(finalChunks, { type: mimeType });
      cleanup();
      resolve({ blob, mimeType, durationMs, markers: [...recordedMarkers] });
    };
    recorder.onerror = () => {
      cleanup();
      reject(new Error("録音中にエラーが発生しました。"));
    };

    if (recorder.state === "recording" || recorder.state === "paused") {
      recorder.stop();
    } else {
      cleanup();
      reject(new Error("録音が既に停止しています。"));
    }
  });
}

export function cancelRecording(): void {
  const recorder = activeRecorder;
  if (recorder && (recorder.state === "recording" || recorder.state === "paused")) {
    recorder.stop();
  }
  cleanup();
}

function cleanup(): void {
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }
  activeRecorder = null;
  chunks = [];
  recordedMarkers = [];
}
