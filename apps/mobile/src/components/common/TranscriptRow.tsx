import { StyleSheet, Text, View } from "react-native";
import { StatusPill } from "../StatusPill";
import { formatTimestamp } from "../../lib/formatTime";
import type { LectureMarker, TranscriptSegment } from "../../types/lecture";

export function findNearbyMarker(segment: TranscriptSegment, markers: LectureMarker[]) {
  return markers.find((marker) => marker.time >= segment.start - 20 && marker.time <= segment.end + 45);
}

export function TranscriptRow({ segment, marker }: { segment: TranscriptSegment; marker?: LectureMarker }) {
  return (
    <View style={[styles.transcriptRow, marker && styles.transcriptRowMarked]}>
      <Text style={styles.transcriptTime}>{formatTimestamp(segment.start)}</Text>
      <View style={styles.transcriptBody}>
        <Text style={styles.transcriptText}>{segment.text}</Text>
        {marker ? <StatusPill label={marker.label} tone={marker.type === "confused" ? "rose" : marker.type === "important" ? "amber" : "blue"} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  transcriptRow: { flexDirection: "row", gap: 12, borderRadius: 22, padding: 14, backgroundColor: "#ffffff" },
  transcriptRowMarked: { backgroundColor: "#f0f9ff", borderWidth: 1, borderColor: "#bae6fd" },
  transcriptTime: { width: 48, fontSize: 12, fontWeight: "900", color: "#0284c7" },
  transcriptBody: { flex: 1, gap: 8 },
  transcriptText: { fontSize: 15, lineHeight: 25, color: "#334155", fontWeight: "500" },
});
