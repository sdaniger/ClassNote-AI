import type { Lecture, LectureMarker, LectureNote, ObsidianSettings, QuizQuestion, StudyCard, TranscriptSegment } from "@/types/lecture";
import { formatJapaneseDate, formatTimestamp } from "@/lib/formatTime";
import { formatFrontmatter } from "./formatFrontmatter";
import { formatTranscript } from "./formatTranscript";

export function buildLectureMarkdown(
  lecture: Lecture,
  note: LectureNote,
  transcript: TranscriptSegment[],
  markers: LectureMarker[],
  settings: ObsidianSettings,
  study?: { cards?: StudyCard[]; quizQuestions?: QuizQuestion[] },
) {
  const date = lecture.recordedAt.slice(0, 10);
  const markerLines = markers.map((marker) => `- ${formatTimestamp(marker.time)} ${marker.label}`).join("\n");

  const sections = [
    formatFrontmatter({
      type: "lecture",
      date,
      course: lecture.course,
      source_audio: lecture.audioFile,
      transcription: lecture.transcriptionStatus,
      tags: ["university", "lecture"],
    }),
    `# ${date} ${lecture.title}`,
    `> ${formatJapaneseDate(lecture.recordedAt)} / ${lecture.course}`,
    "## 要約",
    note.summary,
    "## 重要ポイント",
    note.keyPoints.map((point) => `- ${point}`).join("\n"),
    "## 試験に出そうな部分",
    note.examLikelyPoints.map((point) => `- ${point}`).join("\n"),
    "## タイムライン",
    note.timeline.map((item) => `- ${formatTimestamp(item.start)} ${item.title} - ${item.description}`).join("\n"),
    "## わからなかった場所",
    note.confusingParts.length > 0
      ? note.confusingParts.map((part) => `### ${formatTimestamp(part.markerTime)} ${part.title}\n\n${part.explanation}`).join("\n\n")
      : "特にマーカーはありません。",
  ];

  if (settings.exportQuiz) {
    sections.push("## 復習問題", note.quiz.map((item, index) => `${index + 1}. ${item.question}\n   - ${item.answer}`).join("\n"));
  }

  if (study?.cards?.length) {
    sections.push("## 復習カード", study.cards.map((card) => `### Q. ${card.front}\n\nA. ${card.back}${card.timestamp !== undefined ? `\n\n関連: ${formatTimestamp(card.timestamp)}` : ""}`).join("\n\n"));
  }

  if (study?.quizQuestions?.length) {
    sections.push("## 小テスト", study.quizQuestions.map((question, index) => `${index + 1}. ${question.question}\n   - 答え: ${question.answer}`).join("\n"));
  }

  if (settings.exportMarkers) {
    sections.push("## マーカー", markerLines || "マーカーはありません。");
  }

  if (settings.exportTranscriptFullText) {
    sections.push("## 文字起こし全文", formatTranscript(transcript));
  }

  return sections.filter(Boolean).join("\n\n");
}
