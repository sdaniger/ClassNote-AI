import type { ChatAnswer, ChatReference, Lecture } from "@/types/lecture";
import { searchLectures } from "@/services/search/searchLectures";
import type { SearchIndexItem } from "@/services/search/buildSearchIndex";

export async function answerGlobalStudyQuestion(input: {
  question: string;
  lectures: Lecture[];
  searchIndex: SearchIndexItem[];
}): Promise<ChatAnswer> {
  const results = searchLectures(input.searchIndex, input.question, { period: "all" }).slice(0, 5);
  if (results.length === 0) throw new Error("関連する講義が見つかりませんでした。科目名や用語を変えて試してください。");

  const references: ChatReference[] = results.map((result) => ({ lectureId: result.lectureId, lectureTitle: result.lectureTitle, timestamp: result.timestamp, text: result.matchedText, source: result.source === "lecture" || result.source === "tag" ? "summary" : result.source }));

  return {
    message: `関連する講義を ${references.length} 件見つけました。AI回答は後日差し替え予定です。`,
    references,
    suggestedFollowups: [],
  };
}
