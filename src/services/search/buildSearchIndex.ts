import type { Lecture, LectureMarker, LectureNote, LectureTag, TranscriptSegment } from "@/types/lecture";

export type SearchIndexItem = {
  lectureId: string;
  lectureTitle: string;
  course: string;
  text: string;
  source: "transcript" | "summary" | "timeline" | "quiz" | "marker" | "lecture" | "tag";
  timestamp?: number;
  tags: string[];
  recordedAt: string;
};

export function buildSearchIndex(input: {
  lectures: Lecture[];
  transcriptByLecture: Record<string, TranscriptSegment[]>;
  notesByLecture: Record<string, LectureNote | undefined>;
  markersByLecture: Record<string, LectureMarker[]>;
  tagsByLecture: Record<string, LectureTag[]>;
}): SearchIndexItem[] {
  const items: SearchIndexItem[] = [];

  for (const lecture of input.lectures) {
    const tags = input.tagsByLecture[lecture.id]?.map((tag) => tag.name) ?? [];
    items.push({ lectureId: lecture.id, lectureTitle: lecture.title, course: lecture.course, text: `${lecture.title} ${lecture.course} ${tags.join(" ")}`, source: "lecture", tags, recordedAt: lecture.recordedAt });

    for (const segment of input.transcriptByLecture[lecture.id] ?? []) {
      items.push({ lectureId: lecture.id, lectureTitle: lecture.title, course: lecture.course, text: segment.text, source: "transcript", timestamp: segment.start, tags, recordedAt: lecture.recordedAt });
    }

    const note = input.notesByLecture[lecture.id];
    if (note) {
      items.push({ lectureId: lecture.id, lectureTitle: lecture.title, course: lecture.course, text: note.summary, source: "summary", tags, recordedAt: lecture.recordedAt });
      note.keyPoints.forEach((point) => items.push({ lectureId: lecture.id, lectureTitle: lecture.title, course: lecture.course, text: point, source: "summary", tags, recordedAt: lecture.recordedAt }));
      note.examLikelyPoints.forEach((point) => items.push({ lectureId: lecture.id, lectureTitle: lecture.title, course: lecture.course, text: point, source: "summary", tags: [...tags, "試験に出そう"], recordedAt: lecture.recordedAt }));
      note.timeline.forEach((item) => items.push({ lectureId: lecture.id, lectureTitle: lecture.title, course: lecture.course, text: `${item.title} ${item.description}`, source: "timeline", timestamp: item.start, tags, recordedAt: lecture.recordedAt }));
      note.quiz.forEach((quiz) => items.push({ lectureId: lecture.id, lectureTitle: lecture.title, course: lecture.course, text: `${quiz.question} ${quiz.answer}`, source: "quiz", tags, recordedAt: lecture.recordedAt }));
    }

    for (const marker of input.markersByLecture[lecture.id] ?? []) {
      items.push({ lectureId: lecture.id, lectureTitle: lecture.title, course: lecture.course, text: marker.label, source: "marker", timestamp: marker.time, tags: [...tags, marker.label], recordedAt: lecture.recordedAt });
    }
  }

  return items;
}
