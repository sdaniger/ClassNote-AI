import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import type { AudioMode, CreateMobileLectureInput, Lecture } from "@/types/lecture";
import { defaultAudioMode } from "@/lib/audio/audioModes";

const LECTURES_KEY = "classnote-mobile:lectures:v1";
const AUDIO_MODE_KEY = "classnote-mobile:audio-mode:v1";

export async function loadMobileLectures(): Promise<Lecture[]> {
  try {
    const raw = await AsyncStorage.getItem(LECTURES_KEY);
    return raw ? JSON.parse(raw) as Lecture[] : [];
  } catch {
    return [];
  }
}

export async function saveMobileLectures(lectures: Lecture[]) {
  await AsyncStorage.setItem(LECTURES_KEY, JSON.stringify(lectures));
}

export function createMobileLecture(input: CreateMobileLectureInput): Lecture {
  const now = new Date().toISOString();
  const id = input.id ?? `lecture_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    title: input.title.trim() || "新しい講義",
    course: input.course.trim() || "未設定の科目",
    recordedAt: input.recordedAt,
    durationSec: input.durationSec,
    audioFile: input.audioFile,
    audioUri: input.audioUri,
    audioSizeMb: input.audioSizeMb,
    audioMode: input.audioMode,
    markers: input.markers,
    transcriptionStatus: "not_started",
    syncStatus: "windows_pending",
    device: "mobile",
    version: 1,
    lastModifiedDevice: "mobile",
    versions: [{ version: 1, lectureId: id, changedAt: now, changedBy: "mobile", changeType: "created", description: "スマホで講義を作成" }],
    note: input.note,
    updatedAt: now,
  };
}

export async function saveMobileLectureMetadata(lecture: Lecture) {
  const metadataDir = `${FileSystem.documentDirectory ?? ""}lectures/${lecture.id}/metadata/`;
  await FileSystem.makeDirectoryAsync(metadataDir, { intermediates: true });
  await FileSystem.writeAsStringAsync(`${metadataDir}lecture.json`, JSON.stringify(lecture, null, 2));
}

export function updateMobileLecture(lectures: Lecture[], id: string, patch: Partial<Lecture>) {
  return lectures.map((lecture) => lecture.id === id ? { ...lecture, ...patch, updatedAt: new Date().toISOString() } : lecture);
}

export function deleteMobileLecture(lectures: Lecture[], id: string) {
  return lectures.filter((lecture) => lecture.id !== id);
}

export async function loadAudioMode(): Promise<AudioMode> {
  const stored = await AsyncStorage.getItem(AUDIO_MODE_KEY);
  return isAudioMode(stored) ? stored : defaultAudioMode;
}

export async function saveAudioMode(audioMode: AudioMode) {
  await AsyncStorage.setItem(AUDIO_MODE_KEY, audioMode);
}

function isAudioMode(value: string | null): value is AudioMode {
  return value === "opus_12k_ultra_small" || value === "opus_16k_standard" || value === "opus_24k_readable" || value === "opus_32k_high_quality";
}
