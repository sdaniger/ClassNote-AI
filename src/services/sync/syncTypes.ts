import type { AudioMode, LectureNote, LectureVersion, TranscriptionStatus } from "@/types/lecture";

export type SyncStatus = "local_only" | "windows_pending" | "syncing" | "synced" | "update_available" | "conflict" | "sync_failed";

export type PairingPayload = {
  host: string;
  port: number;
  pairingToken: string;
  deviceName: string;
  baseUrl: string;
};

export type SyncedLecture = {
  id: string;
  title: string;
  course: string;
  recordedAt: string;
  durationSec: number;
  audioFile: string;
  audioSizeMb?: number;
  audioMode: AudioMode;
  transcriptFile?: string;
  markersFile?: string;
  summaryFile?: string;
  transcriptionStatus: TranscriptionStatus;
  syncStatus: SyncStatus;
  device: "mobile" | "windows";
  version?: number;
  lastSyncedAt?: string;
  lastModifiedDevice?: "mobile" | "windows";
  transcriptionEngine?: "mobile-whisper" | "faster-whisper";
  transcriptionModel?: string;
  refinedAt?: string;
  versions?: LectureVersion[];
  updatedAt: string;
};

export type LectureFilePayload = {
  pairingToken: string;
  audioBase64?: string;
  audioFileName?: string;
  transcript?: unknown;
  markers?: unknown;
  noteJson?: unknown;
  noteMarkdown?: string;
};

export type WindowsUpdatePackage = {
  lecture: SyncedLecture;
  transcript: unknown[];
  noteJson?: LectureNote;
  noteMarkdown?: string;
  markers?: unknown;
};
