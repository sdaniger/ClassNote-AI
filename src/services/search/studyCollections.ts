import type { Course, KeyTerm, Lecture, LectureMarker, LectureNote, LectureTag, ReviewQueueItem } from "@/types/lecture";

export function buildTags(lectures: Lecture[], notesByLecture: Record<string, LectureNote | undefined>, markersByLecture: Record<string, LectureMarker[]>): Record<string, LectureTag[]> {
  const result: Record<string, LectureTag[]> = {};
  for (const lecture of lectures) {
    const tags: LectureTag[] = [
      { id: `${lecture.id}-course`, name: lecture.course, type: "auto", color: "sky" },
      ...(markersByLecture[lecture.id]?.some((marker) => marker.type === "confused") ? [{ id: `${lecture.id}-confused`, name: "わからない", type: "auto" as const, color: "rose" }] : []),
      ...(markersByLecture[lecture.id]?.some((marker) => marker.type === "important") ? [{ id: `${lecture.id}-important`, name: "重要", type: "auto" as const, color: "amber" }] : []),
      ...(notesByLecture[lecture.id]?.examLikelyPoints.length ? [{ id: `${lecture.id}-exam`, name: "試験対策", type: "auto" as const, color: "violet" }] : []),
    ];
    result[lecture.id] = tags;
  }
  return result;
}

export function buildCourses(lectures: Lecture[], notesByLecture: Record<string, LectureNote | undefined>, markersByLecture: Record<string, LectureMarker[]>, tagsByLecture: Record<string, LectureTag[]>): Course[] {
  const courses = new Map<string, Lecture[]>();
  lectures.forEach((lecture) => courses.set(lecture.course, [...(courses.get(lecture.course) ?? []), lecture]));
  return [...courses.entries()].map(([name, courseLectures]) => ({
    id: name,
    name,
    lectureCount: courseLectures.length,
    unreviewedCount: courseLectures.filter((lecture) => !notesByLecture[lecture.id]).length,
    confusingMarkerCount: courseLectures.reduce((sum, lecture) => sum + (markersByLecture[lecture.id]?.filter((marker) => marker.type === "confused").length ?? 0), 0),
    lastRecordedAt: courseLectures.map((lecture) => lecture.recordedAt).sort().at(-1),
    tags: [...new Set(courseLectures.flatMap((lecture) => tagsByLecture[lecture.id]?.map((tag) => tag.name) ?? []))],
    examLikelyPointCount: courseLectures.reduce((sum, lecture) => sum + (notesByLecture[lecture.id]?.examLikelyPoints.length ?? 0), 0),
    obsidianExportedCount: courseLectures.filter((lecture) => lecture.obsidianExportStatus === "exported").length,
  }));
}

export function buildReviewQueue(lectures: Lecture[], notesByLecture: Record<string, LectureNote | undefined>, markersByLecture: Record<string, LectureMarker[]>): ReviewQueueItem[] {
  const items: ReviewQueueItem[] = [];
  for (const lecture of lectures) {
    const markers = markersByLecture[lecture.id] ?? [];
    markers.filter((marker) => marker.type === "confused").forEach((marker) => items.push({ id: `${lecture.id}-confused-${marker.time}`, lectureId: lecture.id, type: "confusing_marker", title: lecture.title, description: `${marker.label}マーカーがあります。${Math.floor(marker.time / 60)}分付近から復習しましょう。`, timestamp: marker.time, priority: "high" }));
    if (!notesByLecture[lecture.id]) items.push({ id: `${lecture.id}-unreviewed`, lectureId: lecture.id, type: "unreviewed", title: lecture.title, description: "自動メモがまだ確認されていません。", priority: "medium" });
    if (lecture.transcriptionStatus === "mobile_draft") items.push({ id: `${lecture.id}-refine`, lectureId: lecture.id, type: "needs_desktop_refine", title: lecture.title, description: "Windowsで高精度化すると復習しやすくなります。", priority: "medium" });
    if (lecture.obsidianExportStatus === "not_exported") items.push({ id: `${lecture.id}-obsidian`, lectureId: lecture.id, type: "obsidian_not_exported", title: lecture.title, description: "Obsidianへまだ出力されていません。", priority: "low" });
    notesByLecture[lecture.id]?.examLikelyPoints.forEach((point) => items.push({ id: `${lecture.id}-exam-${point}`, lectureId: lecture.id, type: "exam_likely", title: lecture.title, description: point, priority: "high" }));
  }
  return items.slice(0, 30);
}

export function buildKeyTerms(lectures: Lecture[], notesByLecture: Record<string, LectureNote | undefined>): KeyTerm[] {
  const termCount = new Map<string, { count: number; lectureIds: Set<string>; lectureTitles: Set<string> }>();
  for (const lecture of lectures) {
    const text = `${lecture.title} ${notesByLecture[lecture.id]?.summary ?? ""} ${notesByLecture[lecture.id]?.keyPoints.join(" ") ?? ""}`;
    const words = text.split(/[\s、。，．\s]+/).filter((w) => w.length >= 2);
    for (const word of words) {
      if (!termCount.has(word)) termCount.set(word, { count: 0, lectureIds: new Set(), lectureTitles: new Set() });
      const entry = termCount.get(word)!;
      entry.count++;
      entry.lectureIds.add(lecture.id);
      entry.lectureTitles.add(lecture.title);
    }
  }
  const topTerms = [...termCount.entries()]
    .filter(([, data]) => data.lectureIds.size >= 2)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 20);
  return topTerms.map(([term, data], index) => ({
    id: `term-${index}`,
    term,
    course: lectures.find((l) => data.lectureIds.has(l.id))?.course ?? "全科目",
    lectureIds: [...data.lectureIds],
    lectureTitles: [...data.lectureTitles],
    description: `${term}に関連する講義が${data.lectureIds.size}件あります。`,
    timestamps: [],
  }));
}
