import { StyleSheet, Text, View } from "react-native";
import { colors } from "../design";
import { formatTimestamp } from "../../lib/formatTime";
import type { LectureMarker } from "../../types/lecture";

export function MarkerRow({ marker }: { marker: LectureMarker }) {
  return (
    <View style={styles.markerListRow}>
      <Text style={styles.markerListLabel}>{marker.label}</Text>
      <Text style={styles.markerTime}>{formatTimestamp(marker.time)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  markerListRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 18, padding: 12, backgroundColor: "#f8fafc" },
  markerListLabel: { fontSize: 14, fontWeight: "800", color: colors.slate700 },
  markerTime: { fontSize: 12, fontWeight: "900", color: colors.slate500 },
});
