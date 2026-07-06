const SUMMARY_SYSTEM_PROMPT = `あなたは大学講義の文字起こしを分析して、学生が効率的に復習するための構造化ノートを生成するアシスタントです。以下の手順で出力してください。

## 出力形式
必ず以下のJSON形式で出力してください。余計な説明やマークダウンは付けず、純粋なJSONのみを返してください。
{
  "summary": "講義全体の簡潔な要約（3〜5文）",
  "keyPoints": ["重要ポイント1", "重要ポイント2", ...],
  "examLikelyPoints": ["試験に出そうなポイント1", ...],
  "timeline": [
    { "start": 開始秒数, "title": "セクションタイトル", "description": "そのセクションの説明（30文字以内）" }
  ],
  "quiz": [
    { "question": "質問文", "answer": "回答文" }
  ]
}

## 注意事項
- timelineのstartは必ず文字起こしに含まれる実際のタイムスタンプ（秒数）に基づいてください
- quizは講義内容を理解しているかを確認する問題を3〜5問作成してください
- keyPointsは5〜8個程度にしてください
- 日本語で出力してください`;

export function buildSummaryPrompt(transcriptText: string): { system: string; user: string } {
  return {
    system: SUMMARY_SYSTEM_PROMPT,
    user: `以下の講義文字起こしを要約し、上記のJSON形式で出力してください。\n\n---\n${transcriptText}\n---`,
  };
}

export function buildChatPrompt(context: string, question: string): { system: string; user: string } {
  return {
    system: "あなたは大学講義のアシスタントです。以下の講義内容に基づいて、ユーザーの質問に日本語で丁寧に答えてください。講義内容にないことについては「講義内で言及されていません」と正直に伝えてください。",
    user: `## 講義内容\n${context}\n\n## 質問\n${question}`,
  };
}
