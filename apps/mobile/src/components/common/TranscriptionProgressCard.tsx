import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "../GlassCard";
import type { TranscriptionProgressStep } from "../../types/lecture";

export function transcriptionStatusLabel(status: string) {
  const labels: Record<string, string> = { not_started: "未処理", preprocessing: "前処理中", transcribing: "文字起こし中", mobile_draft: "スマホ下書き", desktop_refining: "Windows高精度化中", desktop_final: "高精度完了", failed: "失敗" };
  return labels[status] ?? status;
}

export function transcriptionStepLabel(step: TranscriptionProgressStep) {
  const labels: Record<TranscriptionProgressStep, string> = { idle: "待機中", preparing_audio: "音声を準備中", loading_model: "モデルを読み込み中", transcribing: "ローカル文字起こし中", saving_transcript: "文字起こし結果を保存中", completed: "完了", failed: "失敗" };
  return labels[step];
}

export function progressPercent(step: TranscriptionProgressStep) {
  const values: Record<TranscriptionProgressStep, number> = { idle: 0, preparing_audio: 18, loading_model: 36, transcribing: 72, saving_transcript: 88, completed: 100, failed: 100 };
  return values[step];
}

export function TranscriptionProgressCard({ step, message, lectureTitle, model }: { step: TranscriptionProgressStep; message: string | null; lectureTitle: string; model: string }) {
  const label = message ?? transcriptionStepLabel(step);
  return (
    <GlassCard style={styles.formCard}>
      <Text style={styles.eyebrow}>On-device transcription</Text>
      <Text style={styles.cardTitle}>{label}</Text>
      <Text style={styles.bodyText}>{lectureTitle} ・ {model}モデル ・ 外部APIには送信しません</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progressPercent(step)}%` }]} /></View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  formCard: { padding: 16, gap: 14 },
  eyebrow: { fontSize: 12, fontWeight: "900", letterSpacing: 2.4, color: "#0369a1", textTransform: "uppercase" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  bodyText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: "#64748b" },
  progressTrack: { height: 9, borderRadius: 999, overflow: "hidden", backgroundColor: "rgba(226,232,240,0.9)", marginTop: 10 },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#38bdf8" },
});
