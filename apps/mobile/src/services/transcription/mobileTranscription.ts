import * as FileSystem from "expo-file-system/legacy";
import type { MobileWhisperModel, TranscriptSegment, TranscriptionProgressStep } from "@/types/lecture";

type TranscribeInput = {
  lectureId: string;
  audioUri: string;
  model: MobileWhisperModel;
  onProgress?: (step: TranscriptionProgressStep, message: string) => void;
};

export async function transcribeLectureOnDevice(input: TranscribeInput): Promise<TranscriptSegment[]> {
  input.onProgress?.("preparing_audio", "音声を準備中");
  const audioInfo = await FileSystem.getInfoAsync(input.audioUri);
  if (!audioInfo.exists) throw new Error("音声ファイルが見つかりません。録音ファイルが端末内に保存されているか確認してください。");

  input.onProgress?.("loading_model", `${input.model}モデルを読み込み中`);
  await delay(600);

  input.onProgress?.("transcribing", "ローカル文字起こし中");
  await delay(input.model === "tiny" ? 900 : input.model === "base" ? 1300 : 1700);

  // Expo managed環境でもUI/保存フローを検証できるmock backend。
  // dev buildではここをwhisper.rn / whisper.cpp呼び出しに差し替える。
  const segments = buildMockTranscript(input.model);
  if (segments.length === 0) throw new Error("文字起こし結果が空でした。tinyモデルで再試行してください。");

  input.onProgress?.("saving_transcript", "文字起こし結果を保存中");
  await delay(250);
  return segments;
}

function buildMockTranscript(model: MobileWhisperModel): TranscriptSegment[] {
  const suffix = model === "tiny" ? "（スマホ下書き）" : "";
  return [
    { start: 12.4, end: 18.9, text: `今日は行列の基本について説明します。${suffix}` },
    { start: 340.0, end: 352.0, text: "まず行列とは、数を縦横に並べたものです。縦方向を行、横方向を列と呼びます。" },
    { start: 730.2, end: 746.4, text: "同じサイズの行列同士であれば、対応する成分を足すことで行列の和を求められます。" },
    { start: 1935.2, end: 1960.8, text: "ここから行列積の説明に入ります。Aの行とBの列を対応させて計算します。" },
    { start: 2450.0, end: 2464.5, text: "この部分は試験に出る可能性があります。定義だけでなく計算手順も確認してください。" },
    { start: 4690.0, end: 4712.5, text: "次回までの課題は、教科書の第4章の演習問題です。" },
  ];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
