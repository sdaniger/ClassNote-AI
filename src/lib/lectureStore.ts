import type { AudioMode, CreateLectureInput, Lecture, LectureMarker, TranscriptSegment } from "@/types/lecture";

const LECTURES_STORAGE_KEY = "classnote-ai:lectures:v1";
const AUDIO_MODE_STORAGE_KEY = "classnote-ai:audio-mode:v1";
const MARKERS_STORAGE_KEY = "classnote-ai:markers:v1";
const TRANSCRIPT_STORAGE_KEY = "classnote-ai:transcript:v1";

export const defaultAudioMode: AudioMode = "opus_16k_standard";

export const audioModeOptions: { id: AudioMode; title: string; description: string; estimated90MinMb: number }[] = [
  { id: "opus_12k_ultra_small", title: "最小容量", description: "Opus 12kbps / mono / 16kHz", estimated90MinMb: 8.1 },
  { id: "opus_16k_standard", title: "標準", description: "Opus 16kbps / mono / 16kHz", estimated90MinMb: 10.8 },
  { id: "opus_24k_readable", title: "聞き返し重視", description: "Opus 24kbps / mono / 24kHz", estimated90MinMb: 16.2 },
  { id: "opus_32k_high_quality", title: "高音質", description: "Opus 32kbps / mono / 48kHz", estimated90MinMb: 21.6 },
];

export function getAudioModeLabel(audioMode: AudioMode) {
  const option = audioModeOptions.find((item) => item.id === audioMode);
  return option ? `${option.title}: ${option.description}` : "標準: Opus 16kbps / mono / 16kHz";
}

export function getAudioModeShortLabel(audioMode: AudioMode) {
  const option = audioModeOptions.find((item) => item.id === audioMode);
  return option?.description.split(" / ")[0] ?? "Opus 16kbps";
}

export function loadLectures(): Lecture[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LECTURES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Lecture[];
    if (!Array.isArray(parsed)) return [];

    const realLectures = parsed.filter(isStoredLecture).filter((lecture) => !lecture.id.startsWith("mock_"));
    if (realLectures.length !== parsed.length) saveLectures(realLectures);
    return realLectures;
  } catch {
    return [];
  }
}

export function saveLectures(lectures: Lecture[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LECTURES_STORAGE_KEY, JSON.stringify(lectures));
  } catch {
    console.error("localStorage容量が不足しています。古い講義データを整理してください。");
  }
}

export function createLecture(input: CreateLectureInput): Lecture {
  const now = new Date().toISOString();
  const estimatedSizeMb = input.originalFileSizeBytes ? Number((input.originalFileSizeBytes / 1024 / 1024).toFixed(1)) : estimateCompressedSizeMb(input.durationSec, input.audioMode);

  return {
    id: `lecture_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim() || "新しい講義",
    course: input.course.trim() || "未設定の科目",
    recordedAt: input.recordedAt,
    durationSec: input.durationSec,
    audioFile: input.audioFile,
    audioSizeMb: estimatedSizeMb,
    audioMode: input.audioMode,
    source: input.source ?? "import",
    audioKey: input.audioKey,
    audioMimeType: input.audioMimeType,
    audioStatus: "imported",
    transcriptionStatus: "not_started",
    summaryStatus: "not_started",
    obsidianExportStatus: "not_exported",
    syncStatus: "local_only",
    note: input.note,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateLecture(lectures: Lecture[], id: string, patch: Partial<Lecture>) {
  const updatedAt = new Date().toISOString();
  return lectures.map((lecture) => (lecture.id === id ? { ...lecture, ...patch, updatedAt } : lecture));
}

export function deleteLecture(lectures: Lecture[], id: string) {
  return lectures.filter((lecture) => lecture.id !== id);
}

export function loadAudioMode(): AudioMode {
  if (typeof window === "undefined") return defaultAudioMode;

  const stored = window.localStorage.getItem(AUDIO_MODE_STORAGE_KEY);
  if (audioModeOptions.some((option) => option.id === stored)) return stored as AudioMode;
  return defaultAudioMode;
}

export function saveAudioMode(audioMode: AudioMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUDIO_MODE_STORAGE_KEY, audioMode);
}

function estimateCompressedSizeMb(durationSec: number, audioMode: AudioMode) {
  const option = audioModeOptions.find((item) => item.id === audioMode) ?? audioModeOptions[1];
  return Number(((durationSec / 5400) * option.estimated90MinMb).toFixed(1));
}

export function loadMarkersByLecture(): Record<string, LectureMarker[]> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(MARKERS_STORAGE_KEY) ?? "{}") as Record<string, LectureMarker[]>; } catch { return {}; }
}

export function saveMarkersByLecture(markers: Record<string, LectureMarker[]>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MARKERS_STORAGE_KEY, JSON.stringify(markers));
  } catch {
    console.error("マーカーの保存に失敗しました。");
  }
}

export function loadTranscriptByLecture(): Record<string, TranscriptSegment[]> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(TRANSCRIPT_STORAGE_KEY) ?? "{}") as Record<string, TranscriptSegment[]>; } catch { return {}; }
}

export function saveTranscriptByLecture(transcripts: Record<string, TranscriptSegment[]>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRANSCRIPT_STORAGE_KEY, JSON.stringify(transcripts));
  } catch {
    console.error("文字起こしの保存に失敗しました。");
  }
}

function isStoredLecture(value: unknown): value is Lecture {
  if (!value || typeof value !== "object") return false;
  const lecture = value as Partial<Lecture>;
  return typeof lecture.id === "string" && typeof lecture.title === "string" && typeof lecture.course === "string" && typeof lecture.recordedAt === "string";
}
