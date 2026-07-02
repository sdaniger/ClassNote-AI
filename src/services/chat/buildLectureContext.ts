import type { Lecture, LectureMarker, LectureNote, TranscriptSegment } from "@/types/lecture";
import type { LectureContextSnippet } from "./chatTypes";

export function buildLectureContext(input: {
  lecture: Lecture;
  question: string;
  transcript: TranscriptSegment[];
  note?: LectureNote;
  markers?: LectureMarker[];
}): LectureContextSnippet[] {
  const keywords = extractKeywords(input.question);
  const snippets: LectureContextSnippet[] = [];

  for (const segment of input.transcript) {
    if (matches(segment.text, keywords) || mentionsTimestamp(input.question, segment.start)) {
      snippets.push({ source: "transcript", text: segment.text, timestamp: segment.start });
    }
  }

  if (input.note) {
    if (matches(input.note.summary, keywords) || input.question.includes("要約") || input.question.includes("簡単")) {
      snippets.push({ source: "summary", text: input.note.summary });
    }
    input.note.keyPoints.forEach((point) => matches(point, keywords) && snippets.push({ source: "summary", text: point }));
    input.note.examLikelyPoints.forEach((point) => (matches(point, keywords) || input.question.includes("試験")) && snippets.push({ source: "summary", text: point }));
    input.note.timeline.forEach((item) => (matches(`${item.title} ${item.description}`, keywords) || mentionsTimestamp(input.question, item.start)) && snippets.push({ source: "timeline", text: `${item.title}: ${item.description}`, timestamp: item.start }));
    input.note.quiz.forEach((item) => input.question.includes("問題") && snippets.push({ source: "quiz", text: `${item.question} ${item.answer}` }));
    input.note.confusingParts.forEach((part) => (input.question.includes("わから") || matches(part.explanation, keywords)) && snippets.push({ source: "marker", text: `${part.title}: ${part.explanation}`, timestamp: part.markerTime }));
  }

  for (const marker of input.markers ?? []) {
    if (input.question.includes(marker.label) || input.question.includes("わから") || input.question.includes("重要")) {
      snippets.push({ source: "marker", text: marker.label, timestamp: marker.time });
    }
  }

  if (snippets.length === 0) {
    input.transcript.slice(0, 3).forEach((segment) => snippets.push({ source: "transcript", text: segment.text, timestamp: segment.start }));
    if (input.note?.summary) snippets.push({ source: "summary", text: input.note.summary });
  }

  return snippets.slice(0, 8);
}

function extractKeywords(question: string) {
  return question
    .replace(/[？?。、，,]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !["この", "講義", "今日", "説明", "して", "ところ", "あたり"].includes(word));
}

function matches(text: string, keywords: string[]) {
  if (keywords.length === 0) return false;
  return keywords.some((keyword) => text.includes(keyword));
}

function mentionsTimestamp(question: string, timestamp: number) {
  const minute = Math.floor(timestamp / 60);
  return question.includes(`${minute}:`) || question.includes(`${minute}分`);
}
