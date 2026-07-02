import type { Lecture, LectureMarker, LectureNote, LectureQuizItem, LectureTimelineItem, TranscriptSegment } from "@/types/lecture";
import { chunkTranscript } from "./chunkTranscript";

export type GenerateLectureSummaryOptions = {
  provider?: "mock" | "openai" | "ollama" | "local";
};

export async function generateLectureSummary(
  lecture: Lecture,
  transcript: TranscriptSegment[],
  markers: LectureMarker[],
  options: GenerateLectureSummaryOptions = {},
): Promise<LectureNote> {
  if (transcript.length === 0) throw new Error("transcript.json が空です。先に文字起こしを完了してください。");

  const provider = options.provider ?? "mock";
  if (provider !== "mock") {
    throw new Error("このプロトタイプではmock要約のみ有効です。後でLLM providerを差し替えられます。");
  }

  const chunks = chunkTranscript(transcript, { maxDurationSec: 600, maxChars: 2800 });
  if (chunks.length === 0) throw new Error("要約に使える文字起こしがありません。");

  const keyPoints = generateKeyPoints(transcript);
  const timeline = generateTimeline(transcript);
  const quiz = generateQuiz(transcript);
  const confusingParts = generateConfusingPartsExplanation(transcript, markers);

  return {
    lectureId: lecture.id,
    summary: `${lecture.course}の講義では、${keyPoints.slice(0, 3).join("、")}を中心に説明されています。復習では定義、計算手順、試験で問われやすい注意点を順番に確認すると理解しやすくなります。`,
    keyPoints,
    examLikelyPoints: [],
    timeline,
    quiz,
    confusingParts,
    reviewChecklist: [],
    generatedAt: new Date().toISOString(),
    jsonPath: `data/lectures/${lecture.id}/notes/lecture-note.json`,
    markdownPath: `data/lectures/${lecture.id}/notes/lecture-note.md`,
  };
}

export function generateKeyPoints(transcript: TranscriptSegment[]) {
  const points = transcript.map((segment) => segment.text).filter(Boolean);
  return points.slice(0, 5);
}

export function generateTimeline(transcript: TranscriptSegment[]): LectureTimelineItem[] {
  const labels = ["導入", "基本事項", "計算手順", "重要ポイント", "練習問題", "課題説明"];
  const picked = transcript.filter((_, index) => index === 0 || index % Math.max(1, Math.floor(transcript.length / 5)) === 0).slice(0, 6);

  return picked.map((segment, index) => ({
    start: segment.start,
    title: inferTimelineTitle(segment.text, labels[index] ?? "章"),
    description: segment.text.length > 54 ? `${segment.text.slice(0, 54)}...` : segment.text,
  }));
}

export function generateQuiz(transcript: TranscriptSegment[]): LectureQuizItem[] {
  return transcript.slice(0, 5).map((segment) => ({
    question: `${segment.text.slice(0, 20)}...の内容を説明してください。`,
    answer: segment.text,
  }));
}

export function generateConfusingPartsExplanation(transcript: TranscriptSegment[], markers: LectureMarker[]) {
  return markers
    .filter((marker) => marker.type === "confused")
    .map((marker) => {
      const nearby = transcript.find((segment) => marker.time >= segment.start - 20 && marker.time <= segment.end + 45) ?? transcript[0];
      return {
        markerTime: marker.time,
        title: inferTimelineTitle(nearby.text, "わからなかった箇所"),
        explanation: `この部分では「${nearby.text}」が説明されています。まず用語の対応関係を確認し、次に先生が示した計算手順を一行ずつ追うと理解しやすくなります。`,
      };
    });
}

function inferTimelineTitle(text: string, fallback: string) {
  return fallback;
}
