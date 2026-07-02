import type { Lecture, LectureMarker, StudyCard, WeakPoint } from "@/types/lecture";

export function buildWeakPoints(input: { lectures: Lecture[]; markersByLecture: Record<string, LectureMarker[]>; cards: StudyCard[] }): WeakPoint[] {
  const weak: WeakPoint[] = [];
  for (const lecture of input.lectures) {
    input.markersByLecture[lecture.id]?.filter((marker) => marker.type === "confused").forEach((marker) => weak.push({ id: `weak_marker_${lecture.id}_${marker.time}`, title: `${lecture.title}: ${marker.label}`, description: "わからないマーカーが付いた箇所です。復習カードか文字起こしから確認しましょう。", course: lecture.course, lectureId: lecture.id, timestamp: marker.time, reason: "confused_marker", priority: "high" }));
    input.cards.filter((card) => card.lectureId === lecture.id && card.status === "weak").forEach((card) => weak.push({ id: `weak_card_${card.id}`, title: card.front, description: card.back, course: lecture.course, lectureId: lecture.id, timestamp: card.timestamp, reason: "marked_weak", priority: "medium" }));
  }
  return weak;
}
