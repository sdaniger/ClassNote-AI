import { copyFile, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { writeJsonWithBackup } from "@/services/storage/safeJsonFile";
import { validateLectureNote } from "@/services/storage/validators";

type SaveNoteRequest = {
  lectureId: string;
  noteJson: unknown;
  markdown: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveNoteRequest;
    if (!body.lectureId) return NextResponse.json({ ok: false, error: "lectureId がありません。" }, { status: 400 });
    if (!validateLectureNote(body.noteJson)) return NextResponse.json({ ok: false, error: "lecture-note.json が不正です。" }, { status: 400 });

    const notesDir = path.resolve(process.cwd(), "data", "lectures", body.lectureId, "notes");
    await mkdir(notesDir, { recursive: true });
    await writeJsonWithBackup(path.join(notesDir, "lecture-note.json"), body.noteJson);
    await writeTextWithBackup(path.join(notesDir, "lecture-note.md"), body.markdown);

    return NextResponse.json({ ok: true, path: notesDir });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "lecture-note保存に失敗しました。" }, { status: 500 });
  }
}

async function writeTextWithBackup(filePath: string, value: string) {
  const backupPath = filePath.replace(/\.md$/, ".backup.md");
  const tempPath = `${filePath}.tmp`;
  try { await copyFile(filePath, backupPath); } catch {}
  await writeFile(tempPath, value, "utf8");
  await rename(tempPath, filePath);
}
