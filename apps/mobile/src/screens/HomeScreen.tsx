import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../components/design";
import { GlassCard } from "../components/GlassCard";
import { StatusPill } from "../components/StatusPill";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { MiniStat } from "../components/common/MiniStat";
import { LectureCard } from "../components/common/LectureCard";
import { formatJapaneseDate } from "../lib/formatTime";
import { getAudioModeShortLabel } from "../lib/audio/audioModes";
import type { AudioMode, Lecture } from "../types/lecture";

export function HomeScreen({ lectures, audioMode, error, onStart, onOpen, onClearError }: { lectures: Lecture[]; audioMode: AudioMode; error: string | null; onStart: () => void; onOpen: (lecture: Lecture) => void; onClearError?: () => void }) {
  const unsyncedCount = lectures.filter((lecture) => lecture.syncStatus !== "synced").length;
  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow={formatJapaneseDate(new Date().toISOString())} title="講義を録音" description="講義中は録音とマーカーに集中。文字起こしは講義後にローカル処理します。" />
      {error ? <ErrorBanner message={error} onDismiss={onClearError} /> : null}
      <GlassCard style={styles.heroCard}>
        <Pressable style={styles.recordStart} onPress={onStart} accessible accessibilityRole="button" accessibilityLabel="新しい講義を録音">
          <Text style={styles.recordStartIcon}>●</Text>
        </Pressable>
        <View style={styles.heroText}>
          <Text style={styles.eyebrowRose}>Ready</Text>
          <Text style={styles.heroTitle}>新しい講義を録音</Text>
          <Text style={styles.bodyText}>スマホで録音し、Windowsで高精度化できます。</Text>
        </View>
      </GlassCard>
      <View style={styles.statGrid3}>
        <MiniStat label="音声" value={getAudioModeShortLabel(audioMode)} />
        <MiniStat label="文字起こし" value="講義後に処理" />
        <MiniStat label="同期" value="Windows未接続" />
      </View>
      <View style={styles.statGrid2}>
        <GlassCard style={styles.smallCard}>
          <Text style={styles.cardTitle}>未同期</Text>
          <Text style={styles.bigNumber}>{unsyncedCount}</Text>
          <StatusPill label="local first" tone="blue" />
        </GlassCard>
        <GlassCard style={styles.smallCard}>
          <Text style={styles.cardTitle}>保存モード</Text>
          <Text style={styles.smallValue}>{getAudioModeShortLabel(audioMode)}</Text>
          <StatusPill label="Opus予定" tone="green" />
        </GlassCard>
      </View>
      <Text style={styles.sectionTitle}>最近の録音</Text>
      {lectures.length === 0 ? (
        <GlassCard solid style={styles.emptyCard}>
          <Text style={styles.cardTitle}>まだ録音がありません</Text>
          <Text style={styles.bodyText}>最初の講義を録音すると、ここに一覧表示されます。</Text>
        </GlassCard>
      ) : lectures.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} onPress={() => onOpen(lecture)} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  heroCard: { padding: 18, flexDirection: "row", gap: 16, alignItems: "center" },
  recordStart: { width: 94, height: 94, borderRadius: 47, backgroundColor: colors.rose, alignItems: "center", justifyContent: "center", shadowColor: colors.rose, shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 16 } },
  recordStartIcon: { color: "white", fontSize: 32 },
  heroText: { flex: 1 },
  eyebrowRose: { fontSize: 11, fontWeight: "900", letterSpacing: 1.8, color: colors.rose, textTransform: "uppercase" },
  heroTitle: { marginTop: 4, fontSize: 23, fontWeight: "800", color: colors.slate950, letterSpacing: -0.3 },
  bodyText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: colors.slate500 },
  statGrid3: { flexDirection: "row", gap: 8 },
  statGrid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  smallCard: { flex: 1, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.slate950 },
  bigNumber: { marginVertical: 8, fontSize: 34, fontWeight: "800", color: colors.slate950 },
  smallValue: { marginVertical: 10, fontSize: 15, fontWeight: "900", color: colors.slate950 },
  sectionTitle: { fontSize: 19, fontWeight: "800", color: colors.slate950, marginTop: 2 },
  emptyCard: { padding: 18 },
});
