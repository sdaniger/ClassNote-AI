import type { AudioMode } from "@/types/lecture";

export const defaultAudioMode: AudioMode = "opus_16k_standard";

export const audioModeOptions: { id: AudioMode; title: string; description: string; estimated90MinMb: number }[] = [
  { id: "opus_12k_ultra_small", title: "最小容量", description: "Opus 12kbps / mono / 16kHz", estimated90MinMb: 8.1 },
  { id: "opus_16k_standard", title: "標準", description: "Opus 16kbps / mono / 16kHz", estimated90MinMb: 10.8 },
  { id: "opus_24k_readable", title: "聞き返し重視", description: "Opus 24kbps / mono / 24kHz", estimated90MinMb: 16.2 },
  { id: "opus_32k_high_quality", title: "高音質", description: "Opus 32kbps / mono / 48kHz", estimated90MinMb: 21.6 },
];

export function getAudioModeShortLabel(audioMode: AudioMode) {
  return audioModeOptions.find((option) => option.id === audioMode)?.description.split(" / ")[0] ?? "Opus 16kbps";
}

export function estimateAudioSizeMb(durationSec: number, audioMode: AudioMode) {
  const option = audioModeOptions.find((item) => item.id === audioMode) ?? audioModeOptions[1];
  return Number(((durationSec / 5400) * option.estimated90MinMb).toFixed(1));
}
