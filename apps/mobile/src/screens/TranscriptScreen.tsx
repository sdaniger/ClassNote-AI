import { StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { colors } from "../components/design";
import { GlassCard } from "../components/GlassCard";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { TranscriptRow, findNearbyMarker } from "../components/common/TranscriptRow";
import { formatDuration } from "../lib/formatTime";
import type { Lecture, TranscriptSegment } from "../types/lecture";

export function TranscriptScreen({ lecture, transcript }: { lecture: Lecture; transcript: TranscriptSegment[] }) {
  const [query, setQuery] = useState("");
  const filtered = transcript.filter((segment) => segment.text.includes(query));

  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Transcript" title="文字起こし" description="スマホ内で生成した下書き文字起こしです。マーカー周辺を強調しています。" />
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>検索</Text>
        <TextInput value={query} onChangeText={setQuery} style={styles.input} placeholder="講義内を検索" placeholderTextColor="#94a3b8" />
      </View>
      <GlassCard solid style={styles.listCard}>
        <View style={styles.playbackBar}>
          <Text style={styles.playbackText}>再生位置ジャンプ風UI</Text>
          <Text style={styles.playbackTime}>{formatDuration(lecture.durationSec)}</Text>
        </View>
        {filtered.length === 0 ? (
          <Text style={styles.bodyText}>文字起こし結果がありません。</Text>
        ) : filtered.map((segment) => (
          <TranscriptRow key={`${segment.start}-${segment.end}`} segment={segment} marker={findNearbyMarker(segment, lecture.markers)} />
        ))}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  inputWrap: { borderRadius: 20, padding: 12, backgroundColor: "#f8fafc" },
  inputLabel: { fontSize: 11, fontWeight: "800", color: colors.slate500 },
  input: { marginTop: 4, fontSize: 15, fontWeight: "700", color: colors.slate950, padding: 0 },
  listCard: { padding: 16, gap: 10 },
  playbackBar: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.slate950, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  playbackText: { color: "white", fontSize: 13, fontWeight: "800" },
  playbackTime: { color: "#bae6fd", fontSize: 12, fontWeight: "900" },
  bodyText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: colors.slate500 },
});
