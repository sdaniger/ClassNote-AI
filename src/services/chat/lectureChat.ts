import type { ChatAnswer, ChatReference, Lecture, LectureMarker, LectureNote, TranscriptSegment } from "@/types/lecture";
import { buildLectureContext } from "./buildLectureContext";

export async function answerLectureQuestion(input: {
  lecture: Lecture;
  question: string;
  transcript: TranscriptSegment[];
  note?: LectureNote;
  markers?: LectureMarker[];
}): Promise<ChatAnswer> {
  if (input.transcript.length === 0) {
    throw new Error("この講義はまだ文字起こしされていません。先に文字起こしを実行してください。");
  }

  const snippets = buildLectureContext(input);
  if (snippets.length === 0) throw new Error("関連する講義内容が見つかりませんでした。質問を少し具体的にしてください。");

  const references: ChatReference[] = snippets.slice(0, 4).map((snippet) => ({
    lectureId: input.lecture.id,
    lectureTitle: input.lecture.title,
    timestamp: snippet.timestamp,
    text: snippet.text,
    source: snippet.source,
  }));

  const message = `文字起こしから関連箇所を ${references.length} 件見つけました。AI回答は後日差し替え予定です。`;

  return {
    message,
    references,
    suggestedFollowups: [],
  };
}
