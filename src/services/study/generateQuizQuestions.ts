import type { Lecture, LectureMarker, LectureNote, QuizQuestion, TranscriptSegment } from "@/types/lecture";

export function generateQuizQuestions(input: { lecture: Lecture; transcript: TranscriptSegment[]; note?: LectureNote; markers?: LectureMarker[] }): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const add = (question: Omit<QuizQuestion, "id" | "lectureId" | "course">) => questions.push({ id: `quiz_${input.lecture.id}_${questions.length}`, lectureId: input.lecture.id, course: input.lecture.course, ...question });

  input.note?.quiz.forEach((item) => add({ question: item.question, answer: item.answer, explanation: item.answer, difficulty: "normal" }));
  input.note?.examLikelyPoints.forEach((point) => add({ question: `試験前に確認すべき内容は？`, choices: [point, "録音ファイル名", "同期方法", "Vault名"], answer: point, explanation: "講義ノートで試験に出そうと判断された項目です。", difficulty: "normal" }));
  const marker = input.markers?.find((item) => item.type === "confused");
  if (marker) add({ question: "わからないマーカーが付いた部分を復習する目的は？", answer: "理解が止まった箇所を重点的に見返すため。", explanation: "苦手ポイントとして優先表示されます。", timestamp: marker.time, difficulty: "easy" });
  return questions;
}
