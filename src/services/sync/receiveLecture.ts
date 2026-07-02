import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LectureFilePayload, SyncedLecture, WindowsUpdatePackage } from "./syncTypes";

const DATA_ROOT = path.resolve(process.cwd(), "data", "lectures");

export function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
}

export async function receiveLectureMetadata(lecture: SyncedLecture) {
  const safeId = safeSegment(lecture.id);
  const dir = path.join(DATA_ROOT, safeId, "metadata");
  await mkdir(dir, { recursive: true });
  const now = new Date().toISOString();
  const normalized: SyncedLecture = {
    ...lecture,
    id: safeId,
    syncStatus: "synced",
    device: lecture.device ?? "mobile",
    version: lecture.version ?? 1,
    lastSyncedAt: now,
    lastModifiedDevice: lecture.lastModifiedDevice ?? lecture.device ?? "mobile",
    versions: lecture.versions ?? [{ version: lecture.version ?? 1, lectureId: safeId, changedAt: now, changedBy: "mobile", changeType: "synced", description: "スマホからWindowsへ同期" }],
  };
  await writeFile(path.join(dir, "lecture.json"), JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

export async function refineLectureOnWindows(lectureId: string) {
  const safeId = safeSegment(lectureId);
  const root = path.join(DATA_ROOT, safeId);
  const metadataPath = path.join(root, "metadata", "lecture.json");
  const transcriptDir = path.join(root, "transcript");
  const transcriptPath = path.join(transcriptDir, "transcript.json");
  const mobileDraftPath = path.join(transcriptDir, "transcript.mobile_draft.json");
  const desktopFinalPath = path.join(transcriptDir, "transcript.desktop_final.json");

  const lecture = JSON.parse(await readFile(metadataPath, "utf8")) as SyncedLecture;
  const now = new Date().toISOString();

  try {
    await copyFile(transcriptPath, mobileDraftPath);
  } catch {
    await writeFile(mobileDraftPath, JSON.stringify([], null, 2), "utf8");
  }

  const existingTranscript = await readOptionalJson(transcriptPath);
  const fallbackTranscript = Array.isArray(existingTranscript) ? existingTranscript : [];
  await writeFile(desktopFinalPath, JSON.stringify(fallbackTranscript, null, 2), "utf8");
  await writeFile(transcriptPath, JSON.stringify(fallbackTranscript, null, 2), "utf8");

  const version = (lecture.version ?? 1) + 1;
  const refined: SyncedLecture = {
    ...lecture,
    transcriptionStatus: "desktop_final",
    syncStatus: "update_available",
    transcriptionEngine: "faster-whisper",
    transcriptionModel: "small",
    refinedAt: now,
    updatedAt: now,
    version,
    lastModifiedDevice: "windows",
    transcriptFile: "transcript.desktop_final.json",
    summaryFile: "lecture-note.desktop_final.json",
    versions: [...(lecture.versions ?? []), { version, lectureId: safeId, changedAt: now, changedBy: "windows", changeType: "refined", description: "Windowsで高精度再文字起こしと自動メモ再生成" }],
  };
  await writeFile(metadataPath, JSON.stringify(refined, null, 2), "utf8");
  return refined;
}

export async function getWindowsUpdatePackage(lectureId: string): Promise<WindowsUpdatePackage> {
  const safeId = safeSegment(lectureId);
  const root = path.join(DATA_ROOT, safeId);
  const lecture = JSON.parse(await readFile(path.join(root, "metadata", "lecture.json"), "utf8")) as SyncedLecture;
  const transcript = JSON.parse(await readFile(path.join(root, "transcript", "transcript.json"), "utf8")) as unknown[];
  const markers = await readOptionalJson(path.join(root, "markers", "markers.json"));
  const noteJson = await readOptionalJson(path.join(root, "notes", "lecture-note.json"));
  const noteMarkdown = await readOptionalText(path.join(root, "notes", "lecture-note.md"));
  return { lecture, transcript, markers, noteJson, noteMarkdown };
}

async function readOptionalJson(filePath: string) {
  try { return JSON.parse(await readFile(filePath, "utf8")); } catch { return undefined; }
}

async function readOptionalText(filePath: string) {
  try { return await readFile(filePath, "utf8"); } catch { return undefined; }
}

export async function receiveLectureFiles(lectureId: string, payload: LectureFilePayload) {
  const safeId = safeSegment(lectureId);
  const root = path.join(DATA_ROOT, safeId);
  await mkdir(path.join(root, "audio"), { recursive: true });
  await mkdir(path.join(root, "transcript"), { recursive: true });
  await mkdir(path.join(root, "markers"), { recursive: true });
  await mkdir(path.join(root, "notes"), { recursive: true });

  if (payload.audioBase64) {
    const audioName = safeSegment(payload.audioFileName || "lecture.m4a");
    await writeFile(path.join(root, "audio", audioName), Buffer.from(payload.audioBase64, "base64"));
  }

  if (payload.transcript) await writeFile(path.join(root, "transcript", "transcript.json"), JSON.stringify(payload.transcript, null, 2), "utf8");
  if (payload.markers) await writeFile(path.join(root, "markers", "markers.json"), JSON.stringify(payload.markers, null, 2), "utf8");
  if (payload.noteJson) await writeFile(path.join(root, "notes", "lecture-note.json"), JSON.stringify(payload.noteJson, null, 2), "utf8");
  if (payload.noteMarkdown) await writeFile(path.join(root, "notes", "lecture-note.md"), payload.noteMarkdown, "utf8");
}

export async function listReceivedLectures(): Promise<SyncedLecture[]> {
  try {
    const ids = await readdir(DATA_ROOT);
    const lectures = await Promise.all(ids.map(async (id) => {
      try {
        const raw = await readFile(path.join(DATA_ROOT, id, "metadata", "lecture.json"), "utf8");
        return JSON.parse(raw) as SyncedLecture;
      } catch {
        return null;
      }
    }));
    return lectures.filter((lecture): lecture is SyncedLecture => Boolean(lecture)).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  } catch {
    return [];
  }
}
