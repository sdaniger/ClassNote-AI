import { NextResponse } from "next/server";

type TranscribeRequest = {
  lectureId: string;
  durationSec: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranscribeRequest;
    if (!body.lectureId) {
      return NextResponse.json({ ok: false, error: "lectureId がありません。" }, { status: 400 });
    }

    const durationSec = Math.max(body.durationSec, 60);
    const segmentCount = Math.max(3, Math.floor(durationSec / 30));
    const segments = generateMockTranscript(segmentCount, durationSec);

    return NextResponse.json({ ok: true, segments });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "文字起こし処理に失敗しました。" }, { status: 500 });
  }
}

function generateMockTranscript(count: number, totalDurationSec: number) {
  const templates = [
    "本日は%sについて説明します。まず基本概念を確認しましょう。",
    "%sの定義は、特定の条件下での振る舞いを記述したものです。",
    "重要なポイントとして、%sの計算手順を理解する必要があります。",
    "ここで注意すべきは、%sの適用範囲です。",
    "%sの具体例を見てみましょう。このケースでは特に境界条件が重要です。",
    "次に%sの応用について考えます。実践的な問題を解いてみましょう。",
    "%sに関するよくある間違いを紹介します。",
    "復習として%sのキーワードを確認しておきましょう。",
    "試験では%sの計算問題が出題される可能性が高いです。",
    "以上の内容を踏まえて、%sの全体像をまとめます。",
  ];

  const topics = [
    "線形代数", "微分積分", "確率統計", "アルゴリズム", "データ構造",
    "ニューラルネットワーク", "最適化理論", "量子力学", "熱力学", "電磁気学",
    "有機化学", "分子生物学", "経済学", "情報理論", "制御工学",
  ];

  const segments = [];
  const interval = totalDurationSec / count;

  for (let i = 0; i < count; i++) {
    const start = Math.round(i * interval);
    const end = Math.round((i + 1) * interval);
    const template = templates[i % templates.length];
    const topic = topics[(i + Math.floor(i / templates.length)) % topics.length];
    const text = template.replace("%s", topic);

    segments.push({
      start,
      end,
      text,
      active: false,
    });
  }

  return segments;
}
