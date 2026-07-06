import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { useCameraPermissions, CameraView } from "expo-camera";
import { colors } from "../components/design";
import { GlassButton } from "../components/GlassButton";
import { GlassCard } from "../components/GlassCard";
import { StatusPill } from "../components/StatusPill";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { TextInputField } from "../components/common/TextInputField";
import { LectureCard } from "../components/common/LectureCard";
import { SyncLectureRow } from "../components/common/SyncLectureRow";
import { SyncProgressCard } from "../components/common/SyncProgressCard";
import type { Lecture, PairingPayload, SyncProgressStep } from "../types/lecture";
import type { WindowsUpdatePackage } from "../services/sync/syncClient";

export function SyncScreen({ lectures, pairing, syncStep, syncMessage, syncingLectureId, pendingUpdate, error, onPair, onSyncLecture, onFetchUpdate, onApplyUpdate, onSyncAll, onClearError }: {
  lectures: Lecture[]; pairing: PairingPayload | null; syncStep: SyncProgressStep; syncMessage: string | null;
  syncingLectureId: string | null; pendingUpdate: { lectureId: string; conflict: boolean; update: WindowsUpdatePackage } | null;
  error: string | null; onPair: (raw: string) => void; onSyncLecture: (lecture: Lecture) => void;
  onFetchUpdate: (lecture: Lecture) => void; onApplyUpdate: (lectureId: string, source: "windows" | "mobile") => void; onSyncAll: () => void; onClearError?: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualQr, setManualQr] = useState("");
  const unsynced = lectures.filter((lecture) => lecture.syncStatus !== "synced");
  const synced = lectures.filter((lecture) => lecture.syncStatus === "synced");

  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Local Sync" title="Windowsと接続" description="講義音声はクラウドに送信されません。同じWi-Fi内のWindows版にだけ転送されます。" />
      {error ? <ErrorBanner message={error} onDismiss={onClearError} /> : null}

      <GlassCard style={styles.formCard}>
        <Text style={styles.cardTitle}>QRコードをスキャン</Text>
        <Text style={styles.bodyText}>Windows版の同期画面に表示されたQRコードを読み取ってペアリングします。</Text>
        {!permission?.granted ? <GlassButton onPress={requestPermission}>カメラ権限を許可</GlassButton> : (
          <View style={styles.cameraBox}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => onPair(data)}
            />
          </View>
        )}
        <TextInputField label="QR JSONを手動入力" value={manualQr} onChangeText={setManualQr} />
        <GlassButton onPress={() => onPair(manualQr)}>接続テスト</GlassButton>
      </GlassCard>

      {pairing ? (
        <GlassCard style={styles.formCard}>
          <Text style={styles.eyebrow}>Connected Windows</Text>
          <Text style={styles.cardTitle}>{pairing.deviceName}</Text>
          <Text style={styles.bodyText}>{pairing.baseUrl}</Text>
          <StatusPill label="ペアリング完了" tone="green" />
        </GlassCard>
      ) : null}

      {syncStep !== "idle" ? <SyncProgressCard step={syncStep} message={syncMessage} /> : null}

      {pendingUpdate ? (
        <GlassCard style={styles.formCard}>
          <Text style={styles.eyebrow}>{pendingUpdate.conflict ? "Conflict" : "Windows Update"}</Text>
          <Text style={styles.cardTitle}>{pendingUpdate.conflict ? "どちらを最新版にしますか？" : "Windows高精度版があります"}</Text>
          <Text style={styles.bodyText}>文字起こし: Windows高精度版 / スマホ下書き版。難しい場合はWindows版がおすすめです。</Text>
          <View style={styles.actionGrid}>
            <GlassButton variant="primary" onPress={() => onApplyUpdate(pendingUpdate.lectureId, "windows")}>Windows版を使う</GlassButton>
            <GlassButton onPress={() => onApplyUpdate(pendingUpdate.lectureId, "mobile")}>スマホ版を使う</GlassButton>
          </View>
        </GlassCard>
      ) : null}

      <GlassCard solid style={styles.listCard}>
        <View style={styles.listHeader}>
          <Text style={styles.cardTitle}>未同期の講義</Text>
          <StatusPill label={`${unsynced.length}件`} tone="amber" />
        </View>
        {unsynced.length === 0 ? <Text style={styles.bodyText}>未同期の講義はありません。</Text> : unsynced.map((lecture) => <SyncLectureRow key={lecture.id} lecture={lecture} syncing={syncingLectureId === lecture.id} onPress={() => onSyncLecture(lecture)} />)}
        <GlassButton variant="primary" onPress={onSyncAll} disabled={!pairing || unsynced.length === 0}>すべて同期</GlassButton>
      </GlassCard>

      <GlassCard solid style={styles.listCard}>
        <View style={styles.listHeader}>
          <Text style={styles.cardTitle}>Windowsから受信可能な更新</Text>
          <StatusPill label="desktop_final" tone="green" />
        </View>
        {lectures.length === 0 ? <Text style={styles.bodyText}>講義がありません。</Text> : lectures.map((lecture) => (
          <View key={lecture.id} style={styles.syncLectureRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{lecture.title}</Text>
              <Text style={styles.bodyText}>{lecture.transcriptionStatus === "desktop_final" ? "高精度版を保持中" : "Windows側の更新を確認できます"}</Text>
            </View>
            <GlassButton onPress={() => onFetchUpdate(lecture)} disabled={!pairing}>更新確認</GlassButton>
          </View>
        ))}
      </GlassCard>

      <GlassCard solid style={styles.listCard}>
        <View style={styles.listHeader}>
          <Text style={styles.cardTitle}>同期済み</Text>
          <StatusPill label={`${synced.length}件`} tone="green" />
        </View>
        {synced.length === 0 ? <Text style={styles.bodyText}>同期済み講義はまだありません。</Text> : synced.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} onPress={() => undefined} />)}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  formCard: { padding: 16, gap: 14 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.slate950 },
  bodyText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: colors.slate500 },
  cameraBox: { height: 220, borderRadius: 28, overflow: "hidden", backgroundColor: colors.slate950, borderWidth: 1, borderColor: "rgba(255,255,255,0.7)" },
  camera: { flex: 1 },
  eyebrow: { fontSize: 12, fontWeight: "900", letterSpacing: 2.4, color: "#0369a1", textTransform: "uppercase" },
  actionGrid: { flexDirection: "row", gap: 12 },
  listCard: { padding: 16, gap: 10 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  syncLectureRow: { borderRadius: 22, padding: 14, backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center", gap: 12 },
});
