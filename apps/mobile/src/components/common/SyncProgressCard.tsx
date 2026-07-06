import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "../GlassCard";
import type { SyncProgressStep } from "../../types/lecture";

export function syncStepLabel(step: SyncProgressStep) {
  const labels: Record<SyncProgressStep, string> = { idle: "待機中", checking_connection: "接続確認中", sending_metadata: "講義メタデータを送信中", sending_audio: "音声ファイルを送信中", sending_transcript: "文字起こしを送信中", sending_markers: "マーカーを送信中", saving_on_windows: "Windows側で保存中", completed: "同期完了", failed: "同期失敗" };
  return labels[step];
}

export function syncProgressPercent(step: SyncProgressStep) {
  const values: Record<SyncProgressStep, number> = { idle: 0, checking_connection: 12, sending_metadata: 28, sending_audio: 54, sending_transcript: 72, sending_markers: 84, saving_on_windows: 94, completed: 100, failed: 100 };
  return values[step];
}

export function SyncProgressCard({ step, message }: { step: SyncProgressStep; message: string | null }) {
  return (
    <GlassCard style={styles.formCard}>
      <Text style={styles.eyebrow}>Sync Progress</Text>
      <Text style={styles.cardTitle}>{message ?? syncStepLabel(step)}</Text>
      <Text style={styles.bodyText}>Windows版の同期画面を開いたまま、同じWi-Fi内で待機してください。</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${syncProgressPercent(step)}%` }]} /></View>
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
