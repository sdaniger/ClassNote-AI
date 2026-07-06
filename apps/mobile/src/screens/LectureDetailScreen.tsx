import { Alert, StyleSheet, Text, View } from "react-native";
import { colors } from "../components/design";
import { GlassButton } from "../components/GlassButton";
import { GlassCard } from "../components/GlassCard";
import { StatusPill } from "../components/StatusPill";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { MiniStat } from "../components/common/MiniStat";
import { MarkerRow } from "../components/common/MarkerRow";
import { TranscriptionProgressCard, transcriptionStatusLabel } from "../components/common/TranscriptionProgressCard";
import { formatDuration, formatJapaneseDate } from "../lib/formatTime";
import { getAudioModeShortLabel } from "../lib/audio/audioModes";
import type { Lecture, MobileTranscriptionSettings, TranscriptSegment, TranscriptionProgressStep } from "../types/lecture";

export function LectureDetailScreen({ lecture, transcript, transcriptionSettings, transcriptionStep, transcriptionMessage, isTranscribing, error, onTranscribe, onOpenTranscript, onClearError }: {
  lecture: Lecture; transcript: TranscriptSegment[]; transcriptionSettings: MobileTranscriptionSettings;
  transcriptionStep: TranscriptionProgressStep; transcriptionMessage: string | null; isTranscribing: boolean;
  error: string | null; onTranscribe: () => void; onOpenTranscript: () => void; onClearError?: () => void;
}) {
  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Lecture" title={lecture.title} description={`${lecture.course} ・ ${formatJapaneseDate(lecture.recordedAt)}`} />
      {error ? <ErrorBanner message={error} onDismiss={onClearError} /> : null}
      <GlassCard style={styles.formCard}>
        <View style={styles.statGrid2}>
          <MiniStat label="録音時間" value={formatDuration(lecture.durationSec)} />
          <MiniStat label="音声サイズ" value={`${lecture.audioSizeMb ?? 0}MB`} />
          <MiniStat label="音声" value={getAudioModeShortLabel(lecture.audioMode)} />
          <MiniStat label="端末" value="mobile" />
        </View>
        <View style={styles.pillRow}>
          <StatusPill label={transcriptionStatusLabel(lecture.transcriptionStatus)} tone={lecture.transcriptionStatus === "mobile_draft" ? "green" : lecture.transcriptionStatus === "failed" ? "rose" : "slate"} />
          <StatusPill label={lecture.syncStatus === "synced" ? "同期完了" : "Windows同期予定"} tone="amber" />
        </View>
        <GlassButton variant="primary" style={styles.fullButton} onPress={() => Alert.alert("再生機能", "音声再生機能は準備中です。今後のアップデートで利用可能になります。")}>音声を再生</GlassButton>
        <GlassButton onPress={onTranscribe} disabled={isTranscribing}>{isTranscribing ? "文字起こし中" : "スマホで文字起こし"}</GlassButton>
        <GlassButton onPress={onOpenTranscript} disabled={transcript.length === 0}>文字起こしを読む</GlassButton>
        <Text style={styles.helpText}>スマホ内で文字起こしします。音声は外部に送信されません。この結果は下書きです。Windows同期後に高精度モデルで再文字起こしできます。</Text>
        <Text style={styles.helpText}>使用モデル: {transcriptionSettings.model} ・ 充電中の処理を推奨</Text>
        <Text style={styles.helpText}>Windowsで高精度化予定。講義音声はクラウドに送信しません。</Text>
      </GlassCard>
      {isTranscribing || transcriptionStep === "completed" || transcriptionStep === "failed" ? (
        <TranscriptionProgressCard step={transcriptionStep} message={transcriptionMessage} lectureTitle={lecture.title} model={transcriptionSettings.model} />
      ) : null}
      <GlassCard solid style={styles.listCard}>
        <Text style={styles.cardTitle}>マーカー一覧</Text>
        {lecture.markers.length === 0 ? <Text style={styles.bodyText}>マーカーはありません。</Text> : lecture.markers.map((marker) => <MarkerRow key={marker.id} marker={marker} />)}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  formCard: { padding: 16, gap: 14 },
  statGrid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  fullButton: { marginTop: 4 },
  helpText: { fontSize: 13, lineHeight: 21, color: colors.slate500 },
  listCard: { padding: 16, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.slate950 },
  bodyText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: colors.slate500 },
});
