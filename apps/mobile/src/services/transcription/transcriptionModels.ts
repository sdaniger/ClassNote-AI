import type { MobileTranscriptionSettings, MobileWhisperModel } from "@/types/lecture";

export const mobileWhisperModels: { id: MobileWhisperModel; title: string; description: string }[] = [
  { id: "tiny", title: "tiny", description: "最速。長い講義の下書き向け。" },
  { id: "base", title: "base", description: "軽量。速度と読みやすさのバランス。" },
  { id: "small", title: "small", description: "標準。時間はかかるが下書き品質が高い。" },
];

export const defaultTranscriptionSettings: MobileTranscriptionSettings = {
  model: "base",
  chargingOnly: false,
  notifyOnComplete: true,
  draftMode: true,
  refineOnWindowsSync: true,
};

export function getModelLabel(model: MobileWhisperModel) {
  return mobileWhisperModels.find((item) => item.id === model)?.title ?? "base";
}
