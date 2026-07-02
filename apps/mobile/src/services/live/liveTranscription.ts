export async function transcribeRecentAudioChunk(input: { lectureId: string; start: number; end: number }) {
  await delay(180);
  const minute = Math.floor(input.end / 60);
  if (minute % 5 === 0) return "ここでは次回までの課題と、復習しておくべきポイントについて説明しています。";
  if (minute % 3 === 0) return "ここから行列積の説明に入ります。Aの行とBの列を対応させて計算します。";
  return "今日は行列の基本と、成分を使った計算方法について説明しています。";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
