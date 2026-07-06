import { StyleSheet, Text, View } from "react-native";
import { colors } from "../design";
import { GlassButton } from "../GlassButton";
import type { Lecture } from "../../types/lecture";

export function SyncLectureRow({ lecture, syncing, onPress }: { lecture: Lecture; syncing: boolean; onPress: () => void }) {
  return (
    <View style={styles.syncLectureRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{lecture.title}</Text>
        <Text style={styles.bodyText}>{lecture.course} ・ {lecture.audioFile}</Text>
      </View>
      <GlassButton onPress={onPress} disabled={syncing}>{syncing ? "同期中" : "同期"}</GlassButton>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.slate950 },
  bodyText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: colors.slate500 },
  syncLectureRow: { borderRadius: 22, padding: 14, backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center", gap: 12 },
});
