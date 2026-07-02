import type { LucideIcon } from "lucide-react";

export type AudioMode =
  | "opus_12k_ultra_small"
  | "opus_16k_standard"
  | "opus_24k_readable"
  | "opus_32k_high_quality";

export type TranscriptionStatus =
  | "not_started"
  | "preprocessing"
  | "transcribing"
  | "mobile_draft"
  | "desktop_refining"
  | "desktop_final"
  | "failed";

export type AudioAssetStatus = "imported" | "compressed";

export type SummaryStatus = "not_started" | "generated";

export type ObsidianExportStatus = "not_exported" | "exported";

export type SyncStatus = "local_only" | "not_connected" | "qr_pairing" | "syncing" | "synced" | "windows_pending" | "update_available" | "conflict" | "sync_failed";

export type LectureVersion = {
  version: number;
  lectureId: string;
  changedAt: string;
  changedBy: "mobile" | "windows";
  changeType: "created" | "transcribed" | "refined" | "note_generated" | "metadata_updated" | "synced" | "conflict_resolved";
  description: string;
};

export type MarkerType = "confused" | "important" | "task";

export type Lecture = {
  id: string;
  title: string;
  course: string;
  recordedAt: string;
  durationSec: number;
  audioFile: string;
  audioSizeMb: number;
  audioMode: AudioMode;
  audioStatus: AudioAssetStatus;
  source?: "recording" | "import";
  audioKey?: string;
  audioMimeType?: string;
  transcriptionStatus: TranscriptionStatus;
  summaryStatus: SummaryStatus;
  obsidianExportStatus: ObsidianExportStatus;
  syncStatus: SyncStatus;
  device?: "mobile" | "windows";
  version?: number;
  lastSyncedAt?: string;
  lastModifiedDevice?: "mobile" | "windows";
  transcriptionEngine?: "mobile-whisper" | "faster-whisper";
  transcriptionModel?: string;
  refinedAt?: string;
  transcriptFile?: string;
  markersFile?: string;
  summaryFile?: string;
  versions?: LectureVersion[];
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateLectureInput = {
  title: string;
  course: string;
  recordedAt: string;
  note?: string;
  audioMode: AudioMode;
  audioFile: string;
  originalFileName?: string;
  originalFileSizeBytes?: number;
  durationSec: number;
  source?: "recording" | "import";
  audioKey?: string;
  audioMimeType?: string;
};

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
  marker?: MarkerType;
  active?: boolean;
};

export type LectureMarker = {
  time: number;
  type: MarkerType;
  label: string;
};

export type LectureTimelineItem = {
  start: number;
  title: string;
  description: string;
};

export type LectureQuizItem = {
  question: string;
  answer: string;
};

export type ConfusingPartNote = {
  markerTime: number;
  title: string;
  explanation: string;
};

export type LectureNote = {
  lectureId: string;
  summary: string;
  keyPoints: string[];
  examLikelyPoints: string[];
  timeline: LectureTimelineItem[];
  quiz: LectureQuizItem[];
  confusingParts: ConfusingPartNote[];
  reviewChecklist: string[];
  generatedAt: string;
  jsonPath: string;
  markdownPath: string;
};

export type ObsidianSettings = {
  vaultName: string;
  vaultPath: string;
  exportFolder: string;
  markdownTemplate: string;
  exportTranscriptFullText: boolean;
  exportQuiz: boolean;
  exportMarkers: boolean;
};

export type SummaryGenerationStep =
  | "idle"
  | "chunking_transcript"
  | "generating_summary"
  | "extracting_key_points"
  | "building_timeline"
  | "generating_quiz"
  | "generating_markdown"
  | "completed"
  | "failed";

export type TimelineChapter = {
  time: number;
  title: string;
  summary: string;
  markerCount: number;
};

export type Course = {
  id: string;
  name: string;
  lectureCount: number;
  unreviewedCount: number;
  confusingMarkerCount: number;
  lastRecordedAt?: string;
  tags: string[];
  examLikelyPointCount: number;
  obsidianExportedCount: number;
};

export type LectureTag = {
  id: string;
  name: string;
  type: "manual" | "auto";
  color?: string;
};

export type SearchResult = {
  lectureId: string;
  lectureTitle: string;
  course: string;
  matchedText: string;
  source: "transcript" | "summary" | "timeline" | "quiz" | "marker" | "lecture" | "tag";
  timestamp?: number;
  tags: string[];
};

export type ReviewQueueItem = {
  id: string;
  lectureId: string;
  type: "confusing_marker" | "important_point" | "unreviewed" | "exam_likely" | "needs_desktop_refine" | "obsidian_not_exported";
  title: string;
  description: string;
  timestamp?: number;
  priority: "low" | "medium" | "high";
};

export type KeyTerm = {
  id: string;
  term: string;
  course: string;
  lectureIds: string[];
  lectureTitles: string[];
  description: string;
  timestamps: { lectureId: string; timestamp: number }[];
};

export type ChatReference = {
  lectureId: string;
  lectureTitle: string;
  timestamp?: number;
  text?: string;
  source: "transcript" | "summary" | "marker" | "timeline" | "quiz";
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  references?: ChatReference[];
};

export type ChatAnswer = {
  message: string;
  references: ChatReference[];
  suggestedFollowups: string[];
};

export type StudyCard = {
  id: string;
  lectureId: string;
  course: string;
  type: "key_term" | "confusing_part" | "exam_likely" | "summary" | "procedure" | "definition";
  front: string;
  back: string;
  explanation?: string;
  timestamp?: number;
  source: "transcript" | "lecture_note" | "marker" | "live_insight";
  status: "new" | "reviewing" | "known" | "weak" | "later";
  createdAt: string;
  updatedAt: string;
};

export type QuizQuestion = {
  id: string;
  lectureId: string;
  course: string;
  question: string;
  choices?: string[];
  answer: string;
  explanation: string;
  timestamp?: number;
  difficulty: "easy" | "normal" | "hard";
};

export type StudySession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  cardIds: string[];
  quizQuestionIds: string[];
  correctCount: number;
  wrongCount: number;
};

export type WeakPoint = {
  id: string;
  title: string;
  description: string;
  course: string;
  lectureId: string;
  timestamp?: number;
  reason: "confused_marker" | "quiz_wrong" | "marked_weak" | "searched_often" | "asked_in_chat";
  priority: "low" | "medium" | "high";
};

export type ReminderSettings = {
  dailyReview: boolean;
  afterLectureReview: boolean;
  beforeExam: boolean;
  notifyWhenBacklogGrows: boolean;
  notificationTime: string;
  courseSettings: Record<string, boolean>;
};

export type AppScreen = "home" | "recording" | "detail" | "sync" | "settings" | "search" | "courses" | "courseDetail" | "reviewQueue" | "tags" | "keyTerms" | "lectureChat" | "globalChat" | "studyHome" | "flashcards" | "quiz" | "examMode" | "weakPoints" | "reminders";

export type DetailTab = "overview" | "transcript" | "timeline" | "review" | "obsidian";

export type BottomNavItem = {
  id: AppScreen;
  label: string;
  icon: LucideIcon;
};
