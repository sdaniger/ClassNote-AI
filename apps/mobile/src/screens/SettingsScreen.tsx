import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../components/design";
import { GlassCard } from "../components/GlassCard";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { SettingToggle } from "../components/common/SettingToggle";
import { audioModeOptions } from "../lib/audio/audioModes";
import { mobileWhisperModels } from "../services/transcription/transcriptionModels";
import type { AudioMode, LiveInsightSettings, MobileTranscriptionSettings } from "../types/lecture";

export function SettingsScreen({ audioMode, transcriptionSettings, liveInsightSettings, onAudioModeChange, onTranscriptionSettingsChange, onLiveInsightSettingsChange }: {
  audioMode: AudioMode; transcriptionSettings: MobileTranscriptionSettings; liveInsightSettings: LiveInsightSettings;
  onAudioModeChange: (mode: AudioMode) => void; onTranscriptionSettingsChange: (settings: MobileTranscriptionSettings) => void;
  onLiveInsightSettingsChange: (settings: LiveInsightSettings) => void;
}) {
  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Settings" title="録音設定" description="スマホで保存する音声モードを選びます。実Opus変換は後でネイティブ処理に差し替えます。" />
      <GlassCard solid style={styles.formCard}>
        {audioModeOptions.map((option) => (
          <Pressable key={option.id} onPress={() => onAudioModeChange(option.id)} style={[styles.optionRow, option.id === audioMode && styles.optionActive]}>
            <View>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.bodyText}>{option.description}</Text>
            </View>
            <Text style={styles.optionSize}>約{option.estimated90MinMb}MB</Text>
          </Pressable>
        ))}
      </GlassCard>

      <ScreenHeader eyebrow="Local Transcription" title="スマホ文字起こし" description="whisper.cpp / whisper.rn系のローカル処理を想定した設定です。結果はmobile_draftとして保存されます。" />
      <GlassCard solid style={styles.formCard}>
        {mobileWhisperModels.map((model) => (
          <Pressable key={model.id} onPress={() => onTranscriptionSettingsChange({ ...transcriptionSettings, model: model.id })} style={[styles.optionRow, model.id === transcriptionSettings.model && styles.optionActive]}>
            <View>
              <Text style={styles.cardTitle}>{model.title}</Text>
              <Text style={styles.bodyText}>{model.description}</Text>
            </View>
          </Pressable>
        ))}
        <SettingToggle label="充電中のみ高負荷処理" checked={transcriptionSettings.chargingOnly} onPress={() => onTranscriptionSettingsChange({ ...transcriptionSettings, chargingOnly: !transcriptionSettings.chargingOnly })} />
        <SettingToggle label="文字起こし完了後に通知" checked={transcriptionSettings.notifyOnComplete} onPress={() => onTranscriptionSettingsChange({ ...transcriptionSettings, notifyOnComplete: !transcriptionSettings.notifyOnComplete })} />
        <SettingToggle label="スマホ文字起こしは下書き扱い" checked={transcriptionSettings.draftMode} onPress={() => onTranscriptionSettingsChange({ ...transcriptionSettings, draftMode: !transcriptionSettings.draftMode })} />
        <SettingToggle label="Windows同期後に高精度化" checked={transcriptionSettings.refineOnWindowsSync} onPress={() => onTranscriptionSettingsChange({ ...transcriptionSettings, refineOnWindowsSync: !transcriptionSettings.refineOnWindowsSync })} />
      </GlassCard>

      <ScreenHeader eyebrow="Live Insight" title="ライブ要約" description="完全リアルタイムではなく、少し遅れて安定して今の話を短く表示します。" />
      <GlassCard solid style={styles.formCard}>
        <SettingToggle label="ライブ要約を有効にする" checked={liveInsightSettings.enabled} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, enabled: !liveInsightSettings.enabled })} />
        <Text style={styles.inputLabel}>更新間隔</Text>
        <View style={styles.optionInline}>
          {([15, 30, 60] as const).map((sec) => (
            <Pressable key={sec} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, updateIntervalSec: sec })} style={[styles.smallOption, liveInsightSettings.updateIntervalSec === sec && styles.optionActive]}>
              <Text style={styles.optionSize}>{sec}秒</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.inputLabel}>要約対象範囲</Text>
        <View style={styles.optionInline}>
          {([30, 60, 90] as const).map((sec) => (
            <Pressable key={sec} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, windowSec: sec })} style={[styles.smallOption, liveInsightSettings.windowSec === sec && styles.optionActive]}>
              <Text style={styles.optionSize}>{sec}秒</Text>
            </Pressable>
          ))}
        </View>
        <SettingToggle label="要約を表示" checked={liveInsightSettings.showSummary} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, showSummary: !liveInsightSettings.showSummary })} />
        <SettingToggle label="やさしい説明を表示" checked={liveInsightSettings.showSimpleExplanation} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, showSimpleExplanation: !liveInsightSettings.showSimpleExplanation })} />
        <SettingToggle label="重要語句を表示" checked={liveInsightSettings.showKeyTerms} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, showKeyTerms: !liveInsightSettings.showKeyTerms })} />
        <SettingToggle label="試験に出そうを表示" checked={liveInsightSettings.showExamLikely} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, showExamLikely: !liveInsightSettings.showExamLikely })} />
        <SettingToggle label="課題っぽいを表示" checked={liveInsightSettings.showAssignmentLikely} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, showAssignmentLikely: !liveInsightSettings.showAssignmentLikely })} />
        <SettingToggle label="スマホ単体では軽量モード" checked={liveInsightSettings.lightweightOnMobile} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, lightweightOnMobile: !liveInsightSettings.lightweightOnMobile })} />
        <SettingToggle label="Windows接続時は高精度モード" checked={liveInsightSettings.highAccuracyWhenWindowsConnected} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, highAccuracyWhenWindowsConnected: !liveInsightSettings.highAccuracyWhenWindowsConnected })} />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  formCard: { padding: 16, gap: 14 },
  optionRow: { borderRadius: 22, padding: 14, backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  optionActive: { backgroundColor: "#e0f2fe", borderWidth: 1, borderColor: "#bae6fd" },
  optionSize: { fontSize: 12, fontWeight: "900", color: "#0369a1" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.slate950 },
  bodyText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: colors.slate500 },
  inputLabel: { fontSize: 11, fontWeight: "800", color: colors.slate500 },
  optionInline: { flexDirection: "row", gap: 8 },
  smallOption: { flex: 1, borderRadius: 18, padding: 12, alignItems: "center", backgroundColor: "#f8fafc" },
});
