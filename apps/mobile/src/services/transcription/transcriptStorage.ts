import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MobileTranscriptionSettings, TranscriptSegment } from "@/types/lecture";
import { defaultTranscriptionSettings } from "./transcriptionModels";

const TRANSCRIPT_INDEX_KEY = "classnote-mobile:transcripts:v1";
const TRANSCRIPTION_SETTINGS_KEY = "classnote-mobile:transcription-settings:v1";

export async function saveTranscript(lectureId: string, segments: TranscriptSegment[]) {
  const transcriptDir = `${FileSystem.documentDirectory ?? ""}lectures/${lectureId}/transcript/`;
  const transcriptUri = `${transcriptDir}transcript.json`;
  await FileSystem.makeDirectoryAsync(transcriptDir, { intermediates: true });
  await FileSystem.writeAsStringAsync(transcriptUri, JSON.stringify(segments, null, 2));

  const index = await loadTranscriptIndex();
  index[lectureId] = segments;
  await AsyncStorage.setItem(TRANSCRIPT_INDEX_KEY, JSON.stringify(index));
}

export async function loadTranscript(lectureId: string): Promise<TranscriptSegment[]> {
  const transcriptUri = `${FileSystem.documentDirectory ?? ""}lectures/${lectureId}/transcript/transcript.json`;

  try {
    const info = await FileSystem.getInfoAsync(transcriptUri);
    if (info.exists) return JSON.parse(await FileSystem.readAsStringAsync(transcriptUri)) as TranscriptSegment[];
  } catch {
    // Fall through to AsyncStorage index. This keeps existing data visible if files are moved.
  }

  const index = await loadTranscriptIndex();
  return index[lectureId] ?? [];
}

export async function deleteTranscript(lectureId: string) {
  const transcriptUri = `${FileSystem.documentDirectory ?? ""}lectures/${lectureId}/transcript/transcript.json`;
  try {
    await FileSystem.deleteAsync(transcriptUri, { idempotent: true });
  } catch {
    // Ignore file deletion failures and still clear index.
  }
  const index = await loadTranscriptIndex();
  delete index[lectureId];
  await AsyncStorage.setItem(TRANSCRIPT_INDEX_KEY, JSON.stringify(index));
}

export async function loadTranscriptIndex(): Promise<Record<string, TranscriptSegment[]>> {
  try {
    return JSON.parse(await AsyncStorage.getItem(TRANSCRIPT_INDEX_KEY) ?? "{}") as Record<string, TranscriptSegment[]>;
  } catch {
    return {};
  }
}

export async function loadTranscriptionSettings(): Promise<MobileTranscriptionSettings> {
  try {
    const raw = await AsyncStorage.getItem(TRANSCRIPTION_SETTINGS_KEY);
    return raw ? { ...defaultTranscriptionSettings, ...JSON.parse(raw) } : defaultTranscriptionSettings;
  } catch {
    return defaultTranscriptionSettings;
  }
}

export async function saveTranscriptionSettings(settings: MobileTranscriptionSettings) {
  await AsyncStorage.setItem(TRANSCRIPTION_SETTINGS_KEY, JSON.stringify(settings));
}
