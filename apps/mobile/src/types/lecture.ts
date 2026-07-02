export type AudioMode =
  | "opus_12k_ultra_small"
  | "opus_16k_standard"
  | "opus_24k_readable"
  | "opus_32k_high_quality";

export type MarkerType = "confused" | "important" | "assignment";

export type TranscriptionStatus = "not_started" | "preprocessing" | "transcribing" | "mobile_draft" | "desktop_refining" | "desktop_final" | "failed";

export type SyncStatus = "local_only" | "windows_pending" | "syncing" | "synced" | "update_available" | "conflict" | "sync_failed";

export type LectureVersion = {
  version: number;
  lectureId: string;
  changedAt: string;
  changedBy: "mobile" | "windows";
  changeType: "created" | "transcribed" | "refined" | "note_generated" | "metadata_updated" | "synced" | "conflict_resolved";
  description: string;
};

export type LectureMarker = {
  id: string;
  time: number;
  type: MarkerType;
  label: string;
  createdAt: string;
};

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export type MobileWhisperModel = "tiny" | "base" | "small";

export type MobileTranscriptionSettings = {
  model: MobileWhisperModel;
  chargingOnly: boolean;
  notifyOnComplete: boolean;
  draftMode: boolean;
  refineOnWindowsSync: boolean;
};

export type LiveLectureInsight = {
  id: string;
  lectureId: string;
  start: number;
  end: number;
  transcriptText: string;
  shortSummary: string;
  simpleExplanation: string;
  keyTerms: string[];
  examLikely?: boolean;
  assignmentLikely?: boolean;
  createdAt: string;
};

export type LiveInsightSettings = {
  enabled: boolean;
  updateIntervalSec: 15 | 30 | 60;
  windowSec: 30 | 60 | 90;
  showSummary: boolean;
  showSimpleExplanation: boolean;
  showKeyTerms: boolean;
  showExamLikely: boolean;
  showAssignmentLikely: boolean;
  lightweightOnMobile: boolean;
  highAccuracyWhenWindowsConnected: boolean;
};

export type TranscriptionProgressStep =
  | "idle"
  | "preparing_audio"
  | "loading_model"
  | "transcribing"
  | "saving_transcript"
  | "completed"
  | "failed";

export type Lecture = {
  id: string;
  title: string;
  course: string;
  recordedAt: string;
  durationSec: number;
  audioFile: string;
  audioUri: string;
  audioSizeMb?: number;
  audioMode: AudioMode;
  transcriptFile?: string;
  markersFile?: string;
  summaryFile?: string;
  markers: LectureMarker[];
  transcriptionStatus: TranscriptionStatus;
  syncStatus: SyncStatus;
  device: "mobile" | "windows";
  version: number;
  lastSyncedAt?: string;
  lastModifiedDevice: "mobile" | "windows";
  transcriptionEngine?: "mobile-whisper" | "faster-whisper";
  transcriptionModel?: string;
  refinedAt?: string;
  versions: LectureVersion[];
  note?: string;
  updatedAt: string;
};

export type CreateMobileLectureInput = {
  id?: string;
  title: string;
  course: string;
  recordedAt: string;
  durationSec: number;
  audioUri: string;
  audioFile: string;
  audioSizeMb?: number;
  audioMode: AudioMode;
  markers: LectureMarker[];
  note?: string;
};

export type RecordingDraft = {
  lectureId: string;
  audioUri: string;
  audioFile: string;
  durationSec: number;
  audioSizeMb?: number;
  markers: LectureMarker[];
  liveInsights: LiveLectureInsight[];
  recordedAt: string;
};

export type PairingPayload = {
  host: string;
  port: number;
  pairingToken: string;
  deviceName: string;
  baseUrl: string;
};

export type SyncProgressStep =
  | "idle"
  | "checking_connection"
  | "sending_metadata"
  | "sending_audio"
  | "sending_transcript"
  | "sending_markers"
  | "saving_on_windows"
  | "completed"
  | "failed";

export type MobileScreen = "home" | "recording" | "complete" | "detail" | "transcript" | "sync" | "settings";
