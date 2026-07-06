import type { ChatAnswer, ChatReference, Lecture, LectureMarker, LectureNote, TranscriptSegment } from "@/types/lecture";
import { buildLectureContext } from "./buildLectureContext";
import { completeChat } from "@/lib/llm/llmClient";
import { buildChatPrompt } from "@/lib/llm/llmPrompts";
import { loadLlmSettings } from "@/lib/llm/llmSettings";

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

  const settings = loadLlmSettings();
  if (settings.provider !== "mock") {
    const contextText = snippets.map((s) =>
      s.timestamp != null
        ? `[${Math.floor(s.timestamp / 60)}:${String(Math.floor(s.timestamp % 60)).padStart(2, "0")}] ${s.text}`
        : s.text
    ).join("\n\n");
    const prompt = buildChatPrompt(contextText, input.question);

    const content = await completeChat(settings, [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ], { temperature: 0.5, maxTokens: 1024 });

    return {
      message: content,
      references,
      suggestedFollowups: [],
    };
  }

  const message = `文字起こしから関連箇所を ${references.length} 件見つけました。AI回答は後日差し替え予定です。`;

  return {
    message,
    references,
    suggestedFollowups: [],
  };
}
