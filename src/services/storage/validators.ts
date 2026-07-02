import type { Lecture, LectureNote, TranscriptSegment } from "@/types/lecture";

export function validateLecture(value: unknown): value is Lecture {
  const lecture = value as Partial<Lecture>;
  return Boolean(lecture?.id && lecture.title && lecture.course && lecture.recordedAt && lecture.audioFile);
}

export function validateTranscript(value: unknown): value is TranscriptSegment[] {
  return Array.isArray(value) && value.every((segment) => typeof segment.start === "number" && typeof segment.end === "number" && typeof segment.text === "string");
}

export function validateLectureNote(value: unknown): value is LectureNote {
  const note = value as Partial<LectureNote>;
  return Boolean(note?.lectureId && typeof note.summary === "string" && Array.isArray(note.keyPoints));
}
