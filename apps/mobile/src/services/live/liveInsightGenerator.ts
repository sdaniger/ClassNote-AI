import type { LiveLectureInsight } from "@/types/lecture";

export async function generateLiveInsight(input: { lectureId: string; start: number; end: number; transcriptText: string }): Promise<LiveLectureInsight> {
  await delay(160);
  const text = input.transcriptText;
  const isMatrixProduct = text.includes("行列積");
  const assignmentLikely = text.includes("課題");
  const examLikely = text.includes("復習") || isMatrixProduct;

  return {
    id: `live_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    lectureId: input.lectureId,
    start: input.start,
    end: input.end,
    transcriptText: text,
    shortSummary: isMatrixProduct ? "行列積の計算方法について説明しています。" : assignmentLikely ? "課題と復習ポイントについて説明しています。" : "行列の基本的な考え方について説明しています。",
    simpleExplanation: isMatrixProduct ? "Aの行とBの列を対応させて、かけ算して足すということです。" : assignmentLikely ? "次回までに確認する内容を先生がまとめています。" : "数を表のように並べて、場所ごとに計算する話です。",
    keyTerms: isMatrixProduct ? ["行列積", "行", "列", "対応"] : assignmentLikely ? ["課題", "復習", "次回"] : ["行列", "成分", "計算"],
    examLikely,
    assignmentLikely,
    createdAt: new Date().toISOString(),
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
