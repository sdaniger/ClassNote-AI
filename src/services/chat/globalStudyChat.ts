import type { ChatAnswer, ChatReference, Lecture } from "@/types/lecture";
import { searchLectures } from "@/services/search/searchLectures";
import type { SearchIndexItem } from "@/services/search/buildSearchIndex";
import { completeChat } from "@/lib/llm/llmClient";
import { buildChatPrompt } from "@/lib/llm/llmPrompts";
import { loadLlmSettings } from "@/lib/llm/llmSettings";

export async function answerGlobalStudyQuestion(input: {
  question: string;
  lectures: Lecture[];
  searchIndex: SearchIndexItem[];
}): Promise<ChatAnswer> {
  const settings = loadLlmSettings();
  const results = searchLectures(input.searchIndex, input.question, { period: "all" }).slice(0, 5);
  if (results.length === 0) throw new Error("関連する講義が見つかりませんでした。科目名や用語を変えて試してください。");

  const references: ChatReference[] = results.map((result) => ({
    lectureId: result.lectureId,
    lectureTitle: result.lectureTitle,
    timestamp: result.timestamp,
    text: result.matchedText,
    source: result.source === "lecture" || result.source === "tag" ? "summary" : result.source,
  }));

  if (settings.provider !== "mock") {
    const contextText = results.map((r) =>
      r.timestamp != null
        ? `[講義: ${r.lectureTitle}] [${Math.floor(r.timestamp / 60)}:${String(Math.floor(r.timestamp % 60)).padStart(2, "0")}] ${r.matchedText}`
        : `[講義: ${r.lectureTitle}] ${r.matchedText}`
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

  return {
    message: `関連する講義を ${references.length} 件見つけました。AI回答は後日差し替え予定です。`,
    references,
    suggestedFollowups: [],
  };
}
