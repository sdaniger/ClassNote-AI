import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, View } from "react-native";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { ToastProvider, useToast } from "./src/hooks/useToast";
import { ToastContainer } from "./src/components/feedback/Toast";
import { defaultAudioMode } from "./src/lib/audio/audioModes";
import { loadAudioMode, loadMobileLectures, saveAudioMode, saveMobileLectureMetadata, saveMobileLectures } from "./src/lib/storage/mobileLectureStore";
import { transcribeLectureOnDevice } from "./src/services/transcription/mobileTranscription";
import { fetchWindowsUpdate, pairWithWindows, parsePairingPayload, syncLectureToWindows } from "./src/services/sync/syncClient";
import { defaultLiveInsightSettings, loadLiveInsightSettings, saveLiveInsightSettings } from "./src/services/live/liveInsightStorage";
import { defaultTranscriptionSettings } from "./src/services/transcription/transcriptionModels";
import { loadTranscriptIndex, loadTranscriptionSettings, saveTranscript, saveTranscriptionSettings } from "./src/services/transcription/transcriptStorage";
import { sharedStyles } from "./src/styles/shared";
import { HomeScreen } from "./src/screens/HomeScreen";
import { RecordingScreen } from "./src/screens/RecordingScreen";
import { RecordingCompleteScreen } from "./src/screens/RecordingCompleteScreen";
import { LectureDetailScreen } from "./src/screens/LectureDetailScreen";
import { TranscriptScreen } from "./src/screens/TranscriptScreen";
import { SyncScreen } from "./src/screens/SyncScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { FloatingTabBar } from "./src/components/common/FloatingTabBar";
import type { AudioMode, Lecture, LiveInsightSettings, MobileScreen, MobileTranscriptionSettings, PairingPayload, RecordingDraft, SyncProgressStep, TranscriptionProgressStep, TranscriptSegment } from "./src/types/lecture";
import type { WindowsUpdatePackage } from "./src/services/sync/syncClient";

export default function AppRoot() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  );
}

function App() {
  const { addToast } = useToast();
  const [screen, setScreen] = useState<MobileScreen>("home");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [audioMode, setAudioMode] = useState<AudioMode>(defaultAudioMode);
  const [transcriptionSettings, setTranscriptionSettings] = useState<MobileTranscriptionSettings>(defaultTranscriptionSettings);
  const [liveInsightSettings, setLiveInsightSettings] = useState<LiveInsightSettings>(defaultLiveInsightSettings);
  const [transcripts, setTranscripts] = useState<Record<string, TranscriptSegment[]>>({});
  const [transcriptionStep, setTranscriptionStep] = useState<TranscriptionProgressStep>("idle");
  const [transcriptionMessage, setTranscriptionMessage] = useState<string | null>(null);
  const [transcribingLectureId, setTranscribingLectureId] = useState<string | null>(null);
  const [pairing, setPairing] = useState<PairingPayload | null>(null);
  const [syncStep, setSyncStep] = useState<SyncProgressStep>("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncingLectureId, setSyncingLectureId] = useState<string | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<{ lectureId: string; conflict: boolean; update: WindowsUpdatePackage } | null>(null);
  const [draft, setDraft] = useState<RecordingDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    const [storedLectures, storedAudioMode, storedTranscripts, storedTranscriptionSettings, storedLiveInsightSettings] = await Promise.all([loadMobileLectures(), loadAudioMode(), loadTranscriptIndex(), loadTranscriptionSettings(), loadLiveInsightSettings()]);
    setLectures(storedLectures);
    setAudioMode(storedAudioMode);
    setTranscripts(storedTranscripts);
    setTranscriptionSettings(storedTranscriptionSettings);
    setLiveInsightSettings(storedLiveInsightSettings);
  }

  async function persistLectures(nextLectures: Lecture[]) {
    setLectures(nextLectures);
    try {
      await saveMobileLectures(nextLectures);
    } catch {
      setError("ローカル保存に失敗しました。ストレージ容量を確認してください。");
    }
  }

  async function handleAudioModeChange(nextMode: AudioMode) {
    setAudioMode(nextMode);
    try {
      await saveAudioMode(nextMode);
    } catch {
      setError("音声モードの保存に失敗しました。");
    }
  }

  async function handleTranscriptionSettingsChange(nextSettings: MobileTranscriptionSettings) {
    setTranscriptionSettings(nextSettings);
    try {
      await saveTranscriptionSettings(nextSettings);
    } catch {
      setError("文字起こし設定の保存に失敗しました。");
    }
  }

  async function handleLiveInsightSettingsChange(nextSettings: LiveInsightSettings) {
    setLiveInsightSettings(nextSettings);
    try {
      await saveLiveInsightSettings(nextSettings);
    } catch {
      setError("ライブ解説設定の保存に失敗しました。");
    }
  }

  async function handleTranscribe(lecture: Lecture) {
    setError(null);
    setTranscribingLectureId(lecture.id);
    setTranscriptionStep("preparing_audio");

    try {
      const preprocessingLectures = lectures.map((item) => item.id === lecture.id ? { ...item, transcriptionStatus: "preprocessing" as const, updatedAt: new Date().toISOString() } : item);
      await persistLectures(preprocessingLectures);

      const segments = await transcribeLectureOnDevice({
        lectureId: lecture.id,
        audioUri: lecture.audioUri,
        model: transcriptionSettings.model,
        onProgress: (step, message) => {
          setTranscriptionStep(step);
          setTranscriptionMessage(message);
          if (step === "transcribing") {
            void persistLectures(lectures.map((item) => item.id === lecture.id ? { ...item, transcriptionStatus: "transcribing" as const, updatedAt: new Date().toISOString() } : item));
          }
        },
      });

      await saveTranscript(lecture.id, segments);
      setTranscripts((current) => ({ ...current, [lecture.id]: segments }));

      const completedLectures = preprocessingLectures.map((item) => item.id === lecture.id ? { ...item, transcriptionStatus: "mobile_draft" as const, updatedAt: new Date().toISOString() } : item);
      const completedLecturesWithHistory = completedLectures.map((item) => item.id === lecture.id ? appendMobileVersion(item, "transcribed", "スマホ内文字起こしを作成") : item);
      await persistLectures(completedLecturesWithHistory);
      const completedLecture = completedLecturesWithHistory.find((item) => item.id === lecture.id);
      if (completedLecture) await saveMobileLectureMetadata(completedLecture);

      setTranscriptionStep("completed");
      setTranscriptionMessage("完了");
      addToast(`「${lecture.title}」の文字起こしが完了しました`, "success");
    } catch (cause) {
      const failedLectures = lectures.map((item) => item.id === lecture.id ? { ...item, transcriptionStatus: "failed" as const, updatedAt: new Date().toISOString() } : item);
      await persistLectures(failedLectures);
      setTranscriptionStep("failed");
      setTranscriptionMessage(null);
      setError(cause instanceof Error ? cause.message : "文字起こしに失敗しました。tinyモデルで再試行してください。");
    } finally {
      setTranscribingLectureId(null);
    }
  }

  async function handlePair(raw: string) {
    setError(null);
    try {
      const nextPairing = parsePairingPayload(raw);
      await pairWithWindows(nextPairing);
      setPairing(nextPairing);
      setSyncMessage(`${nextPairing.deviceName} とペアリングしました。`);
      addToast(`${nextPairing.deviceName} とペアリングしました`, "success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "QRコードが無効です。");
    }
  }

  async function handleSyncLecture(lecture: Lecture) {
    if (!pairing) { setError("Windows版のQRコードを読み取ってから同期してください。"); return; }
    setError(null);
    setSyncingLectureId(lecture.id);
    setSyncStep("checking_connection");

    try {
      const syncingLectures = lectures.map((item) => item.id === lecture.id ? { ...item, syncStatus: "syncing" as const, updatedAt: new Date().toISOString() } : item);
      await persistLectures(syncingLectures);
      await syncLectureToWindows({ pairing, lecture, transcript: transcripts[lecture.id] ?? [], onProgress: (step, message) => { setSyncStep(step); setSyncMessage(message); } });
      const syncedLectures = syncingLectures.map((item) => item.id === lecture.id ? { ...item, syncStatus: "synced" as const, updatedAt: new Date().toISOString() } : item);
      const syncedWithHistory = syncedLectures.map((item) => item.id === lecture.id ? { ...appendMobileVersion(item, "synced", "Windowsへ同期"), lastSyncedAt: new Date().toISOString(), syncStatus: "synced" as const } : item);
      await persistLectures(syncedWithHistory);
      const syncedLecture = syncedWithHistory.find((item) => item.id === lecture.id);
      if (syncedLecture) await saveMobileLectureMetadata(syncedLecture);
      setSyncStep("completed");
      setSyncMessage("同期完了");
      addToast(`「${lecture.title}」をWindowsに同期しました`, "success");
    } catch (cause) {
      const failedLectures = lectures.map((item) => item.id === lecture.id ? { ...item, syncStatus: "sync_failed" as const, updatedAt: new Date().toISOString() } : item);
      await persistLectures(failedLectures);
      setSyncStep("failed");
      setError(cause instanceof Error ? cause.message : "同期中に接続が切れました。Windows版の同期画面を開いたまま、もう一度試してください。");
    } finally {
      setSyncingLectureId(null);
    }
  }

  async function handleFetchWindowsUpdate(lecture: Lecture) {
    if (!pairing) { setError("Windows版のQRコードを読み取ってから更新を確認してください。"); return; }
    setError(null);
    try {
      const result = await fetchWindowsUpdate(pairing, lecture);
      setPendingUpdate({ lectureId: lecture.id, ...result });
      if (result.conflict) {
        const conflicted = lectures.map((item) => item.id === lecture.id ? { ...item, syncStatus: "conflict" as const } : item);
        await persistLectures(conflicted);
        addToast("Windows版とスマホ版で差分があります", "info");
      } else {
        const available = lectures.map((item) => item.id === lecture.id ? { ...item, syncStatus: "update_available" as const } : item);
        await persistLectures(available);
        addToast("Windows高精度版の更新を確認しました", "info");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Windows側の更新確認に失敗しました。");
    }
  }

  async function applyWindowsUpdate(lectureId: string, source: "windows" | "mobile") {
    if (!pendingUpdate || pendingUpdate.lectureId !== lectureId) return;
    if (source === "mobile") {
      const resolved = lectures.map((item) => item.id === lectureId ? appendMobileVersion({ ...item, syncStatus: "synced" as const, lastSyncedAt: new Date().toISOString() }, "conflict_resolved", "スマホ版を最新版として使用") : item);
      await persistLectures(resolved);
      setPendingUpdate(null);
      addToast("スマホ版を最新版として保存しました", "success");
      return;
    }
    const now = new Date().toISOString();
    const updatedLectures = lectures.map((item) => {
      if (item.id !== lectureId) return item;
      const windowsLecture = pendingUpdate.update.lecture;
      return appendMobileVersion({ ...item, ...windowsLecture, audioUri: item.audioUri, markers: pendingUpdate.update.markers ?? item.markers, syncStatus: "synced" as const, lastSyncedAt: now, lastModifiedDevice: "windows" as const, updatedAt: now }, "conflict_resolved", pendingUpdate.conflict ? "Windows高精度版を最新版として使用" : "Windows高精度版を受信");
    });
    await saveTranscript(lectureId, pendingUpdate.update.transcript);
    setTranscripts((current) => ({ ...current, [lectureId]: pendingUpdate.update.transcript }));
    await persistLectures(updatedLectures);
    const updatedLecture = updatedLectures.find((lecture) => lecture.id === lectureId);
    if (updatedLecture) await saveMobileLectureMetadata(updatedLecture);
    setPendingUpdate(null);
    addToast("Windows高精度版を適用しました", "success");
  }

  const selectedLecture = useMemo(() => lectures.find((lecture) => lecture.id === selectedLectureId) ?? lectures[0] ?? null, [lectures, selectedLectureId]);

  return (
    <SafeAreaView style={sharedStyles.root}>
      <ToastContainer />
      <StatusBar barStyle="dark-content" />
      <View style={sharedStyles.bgCircleTop} />
      <View style={sharedStyles.bgCircleBottom} />
      <KeyboardAvoidingView style={sharedStyles.shell} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={sharedStyles.content} showsVerticalScrollIndicator={false}>
          {screen === "home" ? <HomeScreen lectures={lectures} audioMode={audioMode} error={error} onStart={() => setScreen("recording")} onOpen={(lecture) => { setSelectedLectureId(lecture.id); setScreen("detail"); }} onClearError={() => setError(null)} /> : null}
          {screen === "recording" ? <RecordingScreen audioMode={audioMode} liveInsightSettings={liveInsightSettings} onCancel={() => setScreen("home")} onComplete={(nextDraft) => { setDraft(nextDraft); setScreen("complete"); }} /> : null}
          {screen === "complete" && draft ? <RecordingCompleteScreen draft={draft} audioMode={audioMode} onSave={async (lecture) => { const next = [lecture, ...lectures]; await persistLectures(next); setSelectedLectureId(lecture.id); setDraft(null); setScreen("detail"); addToast("講義を保存しました", "success"); }} /> : null}
          {screen === "detail" && selectedLecture ? <LectureDetailScreen lecture={selectedLecture} transcript={transcripts[selectedLecture.id] ?? []} transcriptionSettings={transcriptionSettings} transcriptionStep={transcriptionStep} transcriptionMessage={transcriptionMessage} isTranscribing={transcribingLectureId === selectedLecture.id} error={error} onTranscribe={() => handleTranscribe(selectedLecture)} onOpenTranscript={() => setScreen("transcript")} onClearError={() => setError(null)} /> : null}
          {screen === "transcript" && selectedLecture ? <TranscriptScreen lecture={selectedLecture} transcript={transcripts[selectedLecture.id] ?? []} /> : null}
          {screen === "sync" ? <SyncScreen lectures={lectures} pairing={pairing} syncStep={syncStep} syncMessage={syncMessage} syncingLectureId={syncingLectureId} pendingUpdate={pendingUpdate} error={error} onPair={handlePair} onSyncLecture={handleSyncLecture} onFetchUpdate={handleFetchWindowsUpdate} onApplyUpdate={applyWindowsUpdate} onSyncAll={async () => { await Promise.all(lectures.filter((item) => item.syncStatus !== "synced").map((lecture) => handleSyncLecture(lecture))); }} onClearError={() => setError(null)} /> : null}
          {screen === "settings" ? <SettingsScreen audioMode={audioMode} transcriptionSettings={transcriptionSettings} liveInsightSettings={liveInsightSettings} onAudioModeChange={handleAudioModeChange} onTranscriptionSettingsChange={handleTranscriptionSettingsChange} onLiveInsightSettingsChange={handleLiveInsightSettingsChange} /> : null}
        </ScrollView>
        <FloatingTabBar active={screen} onChange={(next) => setScreen(next)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function appendMobileVersion(lecture: Lecture, changeType: Lecture["versions"][number]["changeType"], description: string): Lecture {
  const version = (lecture.version ?? 1) + 1;
  const changedAt = new Date().toISOString();
  return { ...lecture, version, lastModifiedDevice: "mobile", updatedAt: changedAt, versions: [...(lecture.versions ?? []), { version, lectureId: lecture.id, changedAt, changedBy: "mobile", changeType, description }] };
}
