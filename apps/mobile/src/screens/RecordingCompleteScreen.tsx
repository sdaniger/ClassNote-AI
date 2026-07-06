import { Alert, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { colors } from "../components/design";
import { GlassButton } from "../components/GlassButton";
import { GlassCard } from "../components/GlassCard";
import { StatusPill } from "../components/StatusPill";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { MiniStat } from "../components/common/MiniStat";
import { TextInputField } from "../components/common/TextInputField";
import { formatDuration } from "../lib/formatTime";
import { createMobileLecture, saveMobileLectureMetadata } from "../lib/storage/mobileLectureStore";
import type { AudioMode, Lecture, RecordingDraft } from "../types/lecture";

export function RecordingCompleteScreen({ draft, audioMode, onSave }: { draft: RecordingDraft; audioMode: AudioMode; onSave: (lecture: Lecture) => Promise<void> }) {
  const [title, setTitle] = useState("新しい講義");
  const [course, setCourse] = useState("未設定の科目");
  const [note, setNote] = useState("");

  const save = async () => {
    const lecture = createMobileLecture({ id: draft.lectureId, title, course, note, recordedAt: draft.recordedAt, durationSec: draft.durationSec, audioUri: draft.audioUri, audioFile: draft.audioFile, audioSizeMb: draft.audioSizeMb, audioMode, markers: draft.markers });
    try {
      await saveMobileLectureMetadata(lecture);
      await onSave(lecture);
    } catch {
      Alert.alert("保存に失敗しました", "講義データを端末内に保存できませんでした。ストレージ容量を確認してください。");
    }
  };

  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Complete" title="録音完了" description="講義タイトルと科目を確認して、Windows同期待ちの講義として保存します。" />
      <GlassCard solid style={styles.formCard}>
        <TextInputField label="講義タイトル" value={title} onChangeText={setTitle} />
        <TextInputField label="科目名" value={course} onChangeText={setCourse} />
        <TextInputField label="メモ" value={note} onChangeText={setNote} />
        <View style={styles.statGrid2}>
          <MiniStat label="録音時間" value={formatDuration(draft.durationSec)} />
          <MiniStat label="サイズ" value={`${draft.audioSizeMb ?? 0}MB`} />
          <MiniStat label="マーカー" value={`${draft.markers.length}件`} />
          <MiniStat label="同期" value="Windows予定" />
        </View>
        <StatusPill label="あとで文字起こし" tone="violet" />
        <GlassButton variant="primary" onPress={save} style={styles.fullButton}>講義として保存</GlassButton>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  formCard: { padding: 16, gap: 14 },
  fullButton: { marginTop: 4 },
  statGrid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
});
