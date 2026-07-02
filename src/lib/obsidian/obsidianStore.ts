import type { LectureNote, ObsidianSettings } from "@/types/lecture";

const OBSIDIAN_SETTINGS_KEY = "classnote-ai:obsidian-settings:v1";
const LECTURE_NOTES_KEY = "classnote-ai:lecture-notes:v1";
const LECTURE_MARKDOWN_KEY = "classnote-ai:lecture-markdown:v1";

export const defaultObsidianSettings: ObsidianSettings = {
  vaultName: "大学ノート",
  vaultPath: "",
  exportFolder: "University/Lectures",
  markdownTemplate: "lecture-template.md",
  exportTranscriptFullText: true,
  exportQuiz: true,
  exportMarkers: true,
};

export function loadObsidianSettings(): ObsidianSettings {
  if (typeof window === "undefined") return defaultObsidianSettings;
  try {
    const raw = window.localStorage.getItem(OBSIDIAN_SETTINGS_KEY);
    return raw ? { ...defaultObsidianSettings, ...JSON.parse(raw) } : defaultObsidianSettings;
  } catch {
    return defaultObsidianSettings;
  }
}

export function saveObsidianSettings(settings: ObsidianSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OBSIDIAN_SETTINGS_KEY, JSON.stringify(settings));
}

export function loadLectureNotes(): Record<string, LectureNote> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LECTURE_NOTES_KEY) ?? "{}") as Record<string, LectureNote>;
  } catch {
    return {};
  }
}

export function saveLectureNote(note: LectureNote) {
  if (typeof window === "undefined") return;
  const notes = loadLectureNotes();
  notes[note.lectureId] = note;
  window.localStorage.setItem(LECTURE_NOTES_KEY, JSON.stringify(notes));
}

export function loadLectureMarkdown(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LECTURE_MARKDOWN_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveLectureMarkdown(lectureId: string, markdown: string) {
  if (typeof window === "undefined") return;
  const markdownByLecture = loadLectureMarkdown();
  markdownByLecture[lectureId] = markdown;
  window.localStorage.setItem(LECTURE_MARKDOWN_KEY, JSON.stringify(markdownByLecture));
}
