import type { Lecture, LectureMarker, LectureNote, StudyCard, TranscriptSegment } from "@/types/lecture";

export function generateStudyCardsFromLecture(input: { lecture: Lecture; transcript: TranscriptSegment[]; note?: LectureNote; markers?: LectureMarker[] }): StudyCard[] {
  const now = new Date().toISOString();
  const cards: StudyCard[] = [];
  const add = (card: Omit<StudyCard, "id" | "lectureId" | "course" | "status" | "createdAt" | "updatedAt">) => cards.push({ id: `card_${input.lecture.id}_${cards.length}`, lectureId: input.lecture.id, course: input.lecture.course, status: "new", createdAt: now, updatedAt: now, ...card });

  if (input.note?.summary) add({ type: "summary", front: `${input.lecture.title}を一言で説明すると？`, back: input.note.summary, source: "lecture_note" });
  input.note?.keyPoints.slice(0, 4).forEach((point) => add({ type: "key_term", front: `重要ポイント: ${point.slice(0, 28)}...`, back: point, source: "lecture_note" }));
  input.note?.examLikelyPoints.slice(0, 4).forEach((point) => add({ type: "exam_likely", front: "試験に出そうなポイントは？", back: point, explanation: "試験前モードでも優先表示されます。", source: "lecture_note" }));
  input.note?.confusingParts.forEach((part) => add({ type: "confusing_part", front: `${part.title}で何が重要？`, back: part.explanation, timestamp: part.markerTime, source: "marker" }));
  input.markers?.filter((marker) => marker.type === "confused").forEach((marker) => add({ type: "confusing_part", front: `${Math.floor(marker.time / 60)}分付近でわからなかったことは？`, back: "文字起こしを見返して、用語と手順を一つずつ確認しましょう。", timestamp: marker.time, source: "marker" }));

  return cards;
}
