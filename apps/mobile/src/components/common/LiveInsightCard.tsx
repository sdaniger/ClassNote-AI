import { StyleSheet, Text, View } from "react-native";
import { colors } from "../design";
import { GlassCard } from "../GlassCard";
import { StatusPill } from "../StatusPill";
import { formatTimestamp } from "../../lib/formatTime";
import type { LiveInsightSettings, LiveLectureInsight } from "../../types/lecture";

export function LiveInsightCard({ insight, error, settings }: { insight?: LiveLectureInsight; error: string | null; settings: LiveInsightSettings }) {
  if (!settings.enabled) return null;
  if (error) return (
    <GlassCard style={styles.liveCard}>
      <Text style={styles.cardTitle}>ライブ解説</Text>
      <Text style={styles.errorText}>{error}</Text>
    </GlassCard>
  );
  if (!insight) return (
    <GlassCard style={styles.liveCard}>
      <Text style={styles.cardTitle}>ライブ解説を準備中</Text>
      <Text style={styles.bodyText}>録音を続けると、直近の話を少し遅れて短く表示します。</Text>
    </GlassCard>
  );

  return (
    <GlassCard style={styles.liveCard}>
      <View style={styles.listHeader}>
        <Text style={styles.cardTitle}>ライブ解説</Text>
        <Text style={styles.markerTime}>{formatTimestamp(insight.start)} - {formatTimestamp(insight.end)}</Text>
      </View>
      {settings.showSummary ? <><Text style={styles.inputLabel}>今の話の要約</Text><Text style={styles.liveText}>{insight.shortSummary}</Text></> : null}
      {settings.showSimpleExplanation ? <><Text style={styles.inputLabel}>やさしい説明</Text><Text style={styles.liveText}>{insight.simpleExplanation}</Text></> : null}
      {settings.showKeyTerms ? <View style={styles.termRow}>{insight.keyTerms.map((term) => <Text key={term} style={styles.termChip}>{term}</Text>)}</View> : null}
      <View style={styles.pillRow}>
        {settings.showExamLikely && insight.examLikely ? <StatusPill label="試験に出そう" tone="amber" /> : null}
        {settings.showAssignmentLikely && insight.assignmentLikely ? <StatusPill label="課題っぽい" tone="blue" /> : null}
      </View>
      <Text style={styles.helpText}>この解説は {formatTimestamp(insight.start)}〜{formatTimestamp(insight.end)} の文字起こしをもとに生成されています。</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.slate950 },
  bodyText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: colors.slate500 },
  liveCard: { padding: 16, gap: 10 },
  liveText: { fontSize: 14, lineHeight: 22, color: colors.slate700, fontWeight: "600" },
  errorText: { color: "#be123c", fontSize: 13, lineHeight: 20, fontWeight: "700" },
  markerTime: { fontSize: 12, fontWeight: "900", color: colors.slate500 },
  inputLabel: { fontSize: 11, fontWeight: "800", color: colors.slate500 },
  termRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  termChip: { overflow: "hidden", borderRadius: 999, backgroundColor: "#ede9fe", color: "#6d28d9", paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: "900" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  helpText: { fontSize: 13, lineHeight: 21, color: colors.slate500 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
});
