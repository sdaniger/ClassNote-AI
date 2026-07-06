import { Alert, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { colors } from "../components/design";
import { GlassButton } from "../components/GlassButton";
import { GlassCard } from "../components/GlassCard";
import { RecordingOrb } from "../components/RecordingOrb";
import { WaveformPreview } from "../components/WaveformPreview";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { MarkerButton } from "../components/common/MarkerButton";
import { MarkerRow } from "../components/common/MarkerRow";
import { LiveInsightCard } from "../components/common/LiveInsightCard";
import { useLectureRecorder } from "../lib/audio/useLectureRecorder";
import { estimateAudioSizeMb, getAudioModeShortLabel } from "../lib/audio/audioModes";
import { prepareAudioForStorage } from "../lib/audio/prepareAudioForStorage";
import { formatTimestamp } from "../lib/formatTime";
import { transcribeRecentAudioChunk } from "../services/live/liveTranscription";
import { generateLiveInsight } from "../services/live/liveInsightGenerator";
import { saveLiveInsights } from "../services/live/liveInsightStorage";
import type { AudioMode, LectureMarker, LiveInsightSettings, LiveLectureInsight, MarkerType, RecordingDraft } from "../types/lecture";

const markerMeta: Record<MarkerType, { label: string; tone: "rose" | "amber" | "blue" }> = {
  confused: { label: "わからない", tone: "rose" },
  important: { label: "重要", tone: "amber" },
  assignment: { label: "課題", tone: "blue" },
};

export function RecordingScreen({ audioMode, liveInsightSettings, onCancel, onComplete }: { audioMode: AudioMode; liveInsightSettings: LiveInsightSettings; onCancel: () => void; onComplete: (draft: RecordingDraft) => void }) {
  const recorder = useLectureRecorder();
  const [lectureId] = useState(() => `lecture_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const [markers, setMarkers] = useState<LectureMarker[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [liveInsights, setLiveInsights] = useState<LiveLectureInsight[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastLiveUpdateSec, setLastLiveUpdateSec] = useState(0);

  useEffect(() => {
    if (!liveInsightSettings.enabled || recorder.state !== "recording") return;
    if (recorder.elapsedSec < 12 || recorder.elapsedSec - lastLiveUpdateSec < liveInsightSettings.updateIntervalSec) return;

    let cancelled = false;
    const runLiveInsight = async () => {
      const end = recorder.elapsedSec;
      const start = Math.max(0, end - liveInsightSettings.windowSec);
      try {
        const transcriptText = await transcribeRecentAudioChunk({ lectureId, start, end });
        const insight = await generateLiveInsight({ lectureId, start, end, transcriptText });
        if (cancelled) return;
        const next = [insight, ...liveInsights].slice(0, 12);
        setLiveInsights(next);
        setLastLiveUpdateSec(end);
        setLiveError(null);
        await saveLiveInsights(lectureId, next);
      } catch {
        if (!cancelled) setLiveError("ライブ解説を一時停止しました。録音は継続しています。");
      }
    };
    void runLiveInsight();
    return () => { cancelled = true; };
  }, [lectureId, lastLiveUpdateSec, liveInsightSettings, liveInsights, recorder.elapsedSec, recorder.state]);

  const addMarker = (type: MarkerType) => {
    const meta = markerMeta[type];
    const marker: LectureMarker = { id: `marker_${Date.now()}`, time: recorder.elapsedSec, type, label: meta.label, createdAt: new Date().toISOString() };
    setMarkers((current) => [marker, ...current]);
    setFeedback(`${formatTimestamp(marker.time)} に ${marker.label} を追加`);
  };

  const stopRecording = async () => {
    const stopped = await recorder.stop();
    if (!stopped) return;
    try {
      const prepared = await prepareAudioForStorage(stopped.uri, audioMode, lectureId, stopped.durationSec);
      onComplete({ lectureId, audioUri: prepared.uri, audioFile: prepared.fileName, audioSizeMb: prepared.sizeMb, durationSec: stopped.durationSec, markers, liveInsights, recordedAt: new Date().toISOString() });
    } catch {
      Alert.alert("ファイル保存に失敗しました", "端末のストレージ容量を確認してください。");
    }
  };

  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Recording" title="録音中" description="録音中は安定性を優先し、文字起こしは講義後にローカル処理します。" />
      {recorder.error ? <ErrorBanner message={recorder.error} onDismiss={recorder.clearError} /> : null}
      <GlassCard style={styles.recordingCard}>
        <Text style={styles.recStatus}>{recorder.state === "recording" ? "録音中" : recorder.state === "paused" ? "一時停止中" : "録音準備"}</Text>
        <Text style={styles.timer}>{formatDuration(recorder.elapsedSec)}</Text>
        <RecordingOrb active={recorder.state === "recording"} />
        <WaveformPreview />
        <Text style={styles.estimate}>推定 {estimateAudioSizeMb(recorder.elapsedSec || 1, audioMode)}MB ・ {getAudioModeShortLabel(audioMode)}</Text>
      </GlassCard>
      <LiveInsightCard insight={liveInsights[0]} error={liveError} settings={liveInsightSettings} />
      <View style={styles.markerRow}>
        <MarkerButton label="わからない" tone="rose" onPress={() => addMarker("confused")} />
        <MarkerButton label="重要" tone="amber" onPress={() => addMarker("important")} />
        <MarkerButton label="課題" tone="blue" onPress={() => addMarker("assignment")} />
      </View>
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      <View style={styles.actionGrid}>
        {recorder.state === "idle" || recorder.state === "failed" ? <GlassButton variant="primary" onPress={recorder.start}>録音開始</GlassButton> : null}
        {recorder.state === "recording" ? <GlassButton onPress={recorder.pause}>一時停止</GlassButton> : null}
        {recorder.state === "paused" ? <GlassButton variant="primary" onPress={recorder.resume}>再開</GlassButton> : null}
        {recorder.state !== "idle" && recorder.state !== "failed" ? <GlassButton variant="danger" onPress={stopRecording}>停止</GlassButton> : <GlassButton onPress={onCancel}>戻る</GlassButton>}
      </View>
      <GlassCard solid style={styles.listCard}>
        <Text style={styles.cardTitle}>最近押したマーカー</Text>
        {markers.slice(0, 5).map((marker) => <MarkerRow key={marker.id} marker={marker} />)}
      </GlassCard>
    </View>
  );
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  recordingCard: { padding: 20, alignItems: "center", gap: 12 },
  recStatus: { fontSize: 13, color: colors.rose, fontWeight: "900" },
  timer: { fontSize: 54, fontWeight: "700", color: colors.slate950, letterSpacing: -1.2 },
  estimate: { fontSize: 12, color: colors.slate500, fontWeight: "700" },
  markerRow: { flexDirection: "row", gap: 10 },
  feedback: { alignSelf: "center", borderRadius: 999, overflow: "hidden", paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "rgba(15,23,42,0.92)", color: "white", fontSize: 13, fontWeight: "800" },
  actionGrid: { flexDirection: "row", gap: 12 },
  listCard: { padding: 16, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.slate950 },
});
