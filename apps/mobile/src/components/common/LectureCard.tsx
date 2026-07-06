import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../design";
import { GlassCard } from "../GlassCard";
import { StatusPill } from "../StatusPill";
import { formatDuration } from "../../lib/formatTime";
import type { Lecture } from "../../types/lecture";

export function LectureCard({ lecture, onPress }: { lecture: Lecture; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <GlassCard style={styles.lectureCard}>
        <Text style={styles.cardTitle}>{lecture.title}</Text>
        <Text style={styles.bodyText}>{lecture.course} ・ {formatDuration(lecture.durationSec)} ・ {lecture.markers.length}マーカー</Text>
        <View style={styles.pillRow}>
          <StatusPill label="mobile" tone="violet" />
          <StatusPill label={lecture.syncStatus === "synced" ? "同期済み" : "未同期"} tone="amber" />
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lectureCard: { padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.slate950 },
  bodyText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: colors.slate500 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
});
