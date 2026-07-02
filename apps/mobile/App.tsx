import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { GlassButton } from "./src/components/GlassButton";
import { GlassCard } from "./src/components/GlassCard";
import { RecordingOrb } from "./src/components/RecordingOrb";
import { StatusPill } from "./src/components/StatusPill";
import { WaveformPreview } from "./src/components/WaveformPreview";
import { colors } from "./src/components/design";
import { audioModeOptions, defaultAudioMode, estimateAudioSizeMb, getAudioModeShortLabel } from "./src/lib/audio/audioModes";
import { prepareAudioForStorage } from "./src/lib/audio/prepareAudioForStorage";
import { useLectureRecorder } from "./src/lib/audio/useLectureRecorder";
import { formatDuration, formatJapaneseDate, formatTimestamp } from "./src/lib/formatTime";
import { createMobileLecture, loadAudioMode, loadMobileLectures, saveAudioMode, saveMobileLectureMetadata, saveMobileLectures } from "./src/lib/storage/mobileLectureStore";
import { transcribeLectureOnDevice } from "./src/services/transcription/mobileTranscription";
import { fetchWindowsUpdate, pairWithWindows, parsePairingPayload, syncLectureToWindows, type WindowsUpdatePackage } from "./src/services/sync/syncClient";
import { generateLiveInsight } from "./src/services/live/liveInsightGenerator";
import { defaultLiveInsightSettings, loadLiveInsightSettings, saveLiveInsights, saveLiveInsightSettings } from "./src/services/live/liveInsightStorage";
import { transcribeRecentAudioChunk } from "./src/services/live/liveTranscription";
import { defaultTranscriptionSettings, mobileWhisperModels } from "./src/services/transcription/transcriptionModels";
import { loadTranscriptIndex, loadTranscriptionSettings, saveTranscript, saveTranscriptionSettings } from "./src/services/transcription/transcriptStorage";
import type { AudioMode, Lecture, LectureMarker, LiveInsightSettings, LiveLectureInsight, MarkerType, MobileScreen, MobileTranscriptionSettings, PairingPayload, RecordingDraft, SyncProgressStep, TranscriptSegment, TranscriptionProgressStep } from "./src/types/lecture";

const markerMeta: Record<MarkerType, { label: string; tone: "rose" | "amber" | "blue" }> = {
  confused: { label: "わからない", tone: "rose" },
  important: { label: "重要", tone: "amber" },
  assignment: { label: "課題", tone: "blue" },
};

export default function App() {
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
    await saveAudioMode(nextMode);
  }

  async function handleTranscriptionSettingsChange(nextSettings: MobileTranscriptionSettings) {
    setTranscriptionSettings(nextSettings);
    await saveTranscriptionSettings(nextSettings);
  }

  async function handleLiveInsightSettingsChange(nextSettings: LiveInsightSettings) {
    setLiveInsightSettings(nextSettings);
    await saveLiveInsightSettings(nextSettings);
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "QRコードが無効です。");
    }
  }

  async function handleSyncLecture(lecture: Lecture) {
    if (!pairing) {
      setError("Windows版のQRコードを読み取ってから同期してください。");
      return;
    }
    setError(null);
    setSyncingLectureId(lecture.id);
    setSyncStep("checking_connection");

    try {
      const syncingLectures = lectures.map((item) => item.id === lecture.id ? { ...item, syncStatus: "syncing" as const, updatedAt: new Date().toISOString() } : item);
      await persistLectures(syncingLectures);
      await syncLectureToWindows({
        pairing,
        lecture,
        transcript: transcripts[lecture.id] ?? [],
        onProgress: (step, message) => {
          setSyncStep(step);
          setSyncMessage(message);
        },
      });
      const syncedLectures = syncingLectures.map((item) => item.id === lecture.id ? { ...item, syncStatus: "synced" as const, updatedAt: new Date().toISOString() } : item);
      const syncedWithHistory = syncedLectures.map((item) => item.id === lecture.id ? { ...appendMobileVersion(item, "synced", "Windowsへ同期"), lastSyncedAt: new Date().toISOString(), syncStatus: "synced" as const } : item);
      await persistLectures(syncedWithHistory);
      const syncedLecture = syncedWithHistory.find((item) => item.id === lecture.id);
      if (syncedLecture) await saveMobileLectureMetadata(syncedLecture);
      setSyncStep("completed");
      setSyncMessage("同期完了");
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
    if (!pairing) {
      setError("Windows版のQRコードを読み取ってから更新を確認してください。");
      return;
    }
    try {
      const result = await fetchWindowsUpdate(pairing, lecture);
      setPendingUpdate({ lectureId: lecture.id, ...result });
      if (result.conflict) {
        const conflicted = lectures.map((item) => item.id === lecture.id ? { ...item, syncStatus: "conflict" as const } : item);
        await persistLectures(conflicted);
      } else {
        const available = lectures.map((item) => item.id === lecture.id ? { ...item, syncStatus: "update_available" as const } : item);
        await persistLectures(available);
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
  }

  const selectedLecture = useMemo(() => lectures.find((lecture) => lecture.id === selectedLectureId) ?? lectures[0], [lectures, selectedLectureId]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />
      <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {screen === "home" ? <HomeScreen lectures={lectures} audioMode={audioMode} error={error} onStart={() => setScreen("recording")} onOpen={(lecture) => { setSelectedLectureId(lecture.id); setScreen("detail"); }} /> : null}
          {screen === "recording" ? <RecordingScreen audioMode={audioMode} liveInsightSettings={liveInsightSettings} onCancel={() => setScreen("home")} onComplete={(nextDraft) => { setDraft(nextDraft); setScreen("complete"); }} /> : null}
          {screen === "complete" && draft ? <RecordingCompleteScreen draft={draft} audioMode={audioMode} onSave={async (lecture) => { const next = [lecture, ...lectures]; await persistLectures(next); setSelectedLectureId(lecture.id); setDraft(null); setScreen("detail"); }} /> : null}
          {screen === "detail" && selectedLecture ? <LectureDetailScreen lecture={selectedLecture} transcript={transcripts[selectedLecture.id] ?? []} transcriptionSettings={transcriptionSettings} transcriptionStep={transcriptionStep} transcriptionMessage={transcriptionMessage} isTranscribing={transcribingLectureId === selectedLecture.id} error={error} onTranscribe={() => handleTranscribe(selectedLecture)} onOpenTranscript={() => setScreen("transcript")} /> : null}
          {screen === "transcript" && selectedLecture ? <TranscriptScreen lecture={selectedLecture} transcript={transcripts[selectedLecture.id] ?? []} /> : null}
          {screen === "sync" ? <SyncScreen lectures={lectures} pairing={pairing} syncStep={syncStep} syncMessage={syncMessage} syncingLectureId={syncingLectureId} pendingUpdate={pendingUpdate} error={error} onPair={handlePair} onSyncLecture={handleSyncLecture} onFetchUpdate={handleFetchWindowsUpdate} onApplyUpdate={applyWindowsUpdate} onSyncAll={async () => { for (const lecture of lectures.filter((item) => item.syncStatus !== "synced")) await handleSyncLecture(lecture); }} /> : null}
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
  return {
    ...lecture,
    version,
    lastModifiedDevice: "mobile",
    updatedAt: changedAt,
    versions: [...(lecture.versions ?? []), { version, lectureId: lecture.id, changedAt, changedBy: "mobile", changeType, description }],
  };
}

function HomeScreen({ lectures, audioMode, error, onStart, onOpen }: { lectures: Lecture[]; audioMode: AudioMode; error: string | null; onStart: () => void; onOpen: (lecture: Lecture) => void }) {
  const unsyncedCount = lectures.filter((lecture) => lecture.syncStatus !== "synced").length;
  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow={formatJapaneseDate(new Date().toISOString())} title="講義を録音" description="講義中は録音とマーカーに集中。文字起こしは講義後にローカル処理します。" />
      {error ? <ErrorBanner message={error} /> : null}
      <GlassCard style={styles.heroCard}>
        <Pressable style={styles.recordStart} onPress={onStart}><Text style={styles.recordStartIcon}>●</Text></Pressable>
        <View style={styles.heroText}>
          <Text style={styles.eyebrowRose}>Ready</Text>
          <Text style={styles.heroTitle}>新しい講義を録音</Text>
          <Text style={styles.bodyText}>スマホで録音し、Windowsで高精度化できます。</Text>
        </View>
      </GlassCard>
      <View style={styles.statGrid3}>
        <MiniStat label="音声" value={getAudioModeShortLabel(audioMode)} />
        <MiniStat label="文字起こし" value="講義後に処理" />
        <MiniStat label="同期" value="Windows未接続" />
      </View>
      <View style={styles.statGrid2}>
        <GlassCard style={styles.smallCard}><Text style={styles.cardTitle}>未同期</Text><Text style={styles.bigNumber}>{unsyncedCount}</Text><StatusPill label="local first" tone="blue" /></GlassCard>
        <GlassCard style={styles.smallCard}><Text style={styles.cardTitle}>保存モード</Text><Text style={styles.smallValue}>{getAudioModeShortLabel(audioMode)}</Text><StatusPill label="Opus予定" tone="green" /></GlassCard>
      </View>
      <Text style={styles.sectionTitle}>最近の録音</Text>
      {lectures.length === 0 ? <GlassCard solid style={styles.emptyCard}><Text style={styles.cardTitle}>まだ録音がありません</Text><Text style={styles.bodyText}>最初の講義を録音すると、ここに一覧表示されます。</Text></GlassCard> : lectures.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} onPress={() => onOpen(lecture)} />)}
    </View>
  );
}

function RecordingScreen({ audioMode, liveInsightSettings, onCancel, onComplete }: { audioMode: AudioMode; liveInsightSettings: LiveInsightSettings; onCancel: () => void; onComplete: (draft: RecordingDraft) => void }) {
  const recorder = useLectureRecorder();
  const [lectureId] = useState(() => `lecture_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const [markers, setMarkers] = useState<LectureMarker[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [liveInsights, setLiveInsights] = useState<LiveLectureInsight[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastLiveUpdateSec, setLastLiveUpdateSec] = useState(0);

  useEffect(() => {
    if (!liveInsightSettings.enabled || recorder.state !== "recording") return;
    if (recorder.elapsedSec < 12 || recorder.elapsedSec - lastLiveUpdateSec < liveInsightSettings.updateIntervalSec) return;

    let cancelled = false;
    const runLiveInsight = async () => {
      const end = recorder.elapsedSec;
      const start = Math.max(0, end - liveInsightSettings.windowSec);
      try {
        const transcriptText = await transcribeRecentAudioChunk({ lectureId, start, end });
        const insight = await generateLiveInsight({ lectureId, start, end, transcriptText });
        if (cancelled) return;
        const next = [insight, ...liveInsights].slice(0, 12);
        setLiveInsights(next);
        setLastLiveUpdateSec(end);
        setLiveError(null);
        await saveLiveInsights(lectureId, next);
      } catch {
        if (!cancelled) setLiveError("ライブ解説を一時停止しました。録音は継続しています。");
      }
    };
    void runLiveInsight();
    return () => { cancelled = true; };
  }, [lectureId, lastLiveUpdateSec, liveInsightSettings, liveInsights, recorder.elapsedSec, recorder.state]);

  const addMarker = (type: MarkerType) => {
    const meta = markerMeta[type];
    const marker: LectureMarker = { id: `marker_${Date.now()}`, time: recorder.elapsedSec, type, label: meta.label, createdAt: new Date().toISOString() };
    setMarkers((current) => [marker, ...current]);
    setFeedback(`${formatTimestamp(marker.time)} に ${marker.label} を追加`);
  };

  const stopRecording = async () => {
    const stopped = await recorder.stop();
    if (!stopped) return;
    try {
      const prepared = await prepareAudioForStorage(stopped.uri, audioMode, lectureId, stopped.durationSec);
      onComplete({ lectureId, audioUri: prepared.uri, audioFile: prepared.fileName, audioSizeMb: prepared.sizeMb, durationSec: stopped.durationSec, markers, liveInsights, recordedAt: new Date().toISOString() });
    } catch {
      Alert.alert("ファイル保存に失敗しました", "端末のストレージ容量を確認してください。");
    }
  };

  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Recording" title="録音中" description="録音中は安定性を優先し、文字起こしは講義後にローカル処理します。" />
      {recorder.error ? <ErrorBanner message={recorder.error} /> : null}
      <GlassCard style={styles.recordingCard}>
        <Text style={styles.recStatus}>{recorder.state === "recording" ? "録音中" : recorder.state === "paused" ? "一時停止中" : "録音準備"}</Text>
        <Text style={styles.timer}>{formatDuration(recorder.elapsedSec)}</Text>
        <RecordingOrb active={recorder.state === "recording"} />
        <WaveformPreview />
        <Text style={styles.estimate}>推定 {estimateAudioSizeMb(recorder.elapsedSec || 1, audioMode)}MB ・ {getAudioModeShortLabel(audioMode)}</Text>
      </GlassCard>
      <LiveInsightCard insight={liveInsights[0]} error={liveError} settings={liveInsightSettings} />
      <View style={styles.markerRow}>
        <MarkerButton label="わからない" tone="rose" onPress={() => addMarker("confused")} />
        <MarkerButton label="重要" tone="amber" onPress={() => addMarker("important")} />
        <MarkerButton label="課題" tone="blue" onPress={() => addMarker("assignment")} />
      </View>
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      <View style={styles.actionGrid}>
        {recorder.state === "idle" || recorder.state === "failed" ? <GlassButton variant="primary" onPress={recorder.start}>録音開始</GlassButton> : null}
        {recorder.state === "recording" ? <GlassButton onPress={recorder.pause}>一時停止</GlassButton> : null}
        {recorder.state === "paused" ? <GlassButton variant="primary" onPress={recorder.resume}>再開</GlassButton> : null}
        {recorder.state !== "idle" && recorder.state !== "failed" ? <GlassButton variant="danger" onPress={stopRecording}>停止</GlassButton> : <GlassButton onPress={onCancel}>戻る</GlassButton>}
      </View>
      <GlassCard solid style={styles.listCard}><Text style={styles.cardTitle}>最近押したマーカー</Text>{markers.slice(0, 5).map((marker) => <MarkerRow key={marker.id} marker={marker} />)}</GlassCard>
    </View>
  );
}

function RecordingCompleteScreen({ draft, audioMode, onSave }: { draft: RecordingDraft; audioMode: AudioMode; onSave: (lecture: Lecture) => Promise<void> }) {
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

function LectureDetailScreen({ lecture, transcript, transcriptionSettings, transcriptionStep, transcriptionMessage, isTranscribing, error, onTranscribe, onOpenTranscript }: { lecture: Lecture; transcript: TranscriptSegment[]; transcriptionSettings: MobileTranscriptionSettings; transcriptionStep: TranscriptionProgressStep; transcriptionMessage: string | null; isTranscribing: boolean; error: string | null; onTranscribe: () => void; onOpenTranscript: () => void }) {
  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Lecture" title={lecture.title} description={`${lecture.course} ・ ${formatJapaneseDate(lecture.recordedAt)}`} />
      {error ? <ErrorBanner message={error} /> : null}
      <GlassCard style={styles.formCard}>
        <View style={styles.statGrid2}>
          <MiniStat label="録音時間" value={formatDuration(lecture.durationSec)} />
          <MiniStat label="音声サイズ" value={`${lecture.audioSizeMb ?? 0}MB`} />
          <MiniStat label="音声" value={getAudioModeShortLabel(lecture.audioMode)} />
          <MiniStat label="端末" value="mobile" />
        </View>
        <View style={styles.pillRow}><StatusPill label={transcriptionStatusLabel(lecture.transcriptionStatus)} tone={lecture.transcriptionStatus === "mobile_draft" ? "green" : lecture.transcriptionStatus === "failed" ? "rose" : "slate"} /><StatusPill label={lecture.syncStatus === "synced" ? "同期完了" : "Windows同期予定"} tone="amber" /></View>
        <GlassButton variant="primary" style={styles.fullButton}>音声を再生</GlassButton>
        <GlassButton onPress={onTranscribe} disabled={isTranscribing}>{isTranscribing ? "文字起こし中" : "スマホで文字起こし"}</GlassButton>
        <GlassButton onPress={onOpenTranscript} disabled={transcript.length === 0}>文字起こしを読む</GlassButton>
        <Text style={styles.helpText}>スマホ内で文字起こしします。音声は外部に送信されません。この結果は下書きです。Windows同期後に高精度モデルで再文字起こしできます。</Text>
        <Text style={styles.helpText}>使用モデル: {transcriptionSettings.model} ・ 充電中の処理を推奨</Text>
        <Text style={styles.helpText}>Windowsで高精度化予定。講義音声はクラウドに送信しません。</Text>
      </GlassCard>
      {isTranscribing || transcriptionStep === "completed" || transcriptionStep === "failed" ? <TranscriptionProgressCard step={transcriptionStep} message={transcriptionMessage} lectureTitle={lecture.title} model={transcriptionSettings.model} /> : null}
      <GlassCard solid style={styles.listCard}><Text style={styles.cardTitle}>マーカー一覧</Text>{lecture.markers.length === 0 ? <Text style={styles.bodyText}>マーカーはありません。</Text> : lecture.markers.map((marker) => <MarkerRow key={marker.id} marker={marker} />)}</GlassCard>
    </View>
  );
}

function TranscriptScreen({ lecture, transcript }: { lecture: Lecture; transcript: TranscriptSegment[] }) {
  const [query, setQuery] = useState("");
  const filtered = transcript.filter((segment) => segment.text.includes(query));

  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Transcript" title="文字起こし" description="スマホ内で生成した下書き文字起こしです。マーカー周辺を強調しています。" />
      <View style={styles.inputWrap}><Text style={styles.inputLabel}>検索</Text><TextInput value={query} onChangeText={setQuery} style={styles.input} placeholder="講義内を検索" placeholderTextColor="#94a3b8" /></View>
      <GlassCard solid style={styles.listCard}>
        <View style={styles.playbackBar}><Text style={styles.playbackText}>再生位置ジャンプ風UI</Text><Text style={styles.playbackTime}>{formatDuration(lecture.durationSec)}</Text></View>
        {filtered.length === 0 ? <Text style={styles.bodyText}>文字起こし結果がありません。</Text> : filtered.map((segment) => <TranscriptRow key={`${segment.start}-${segment.end}`} segment={segment} marker={findNearbyMarker(segment, lecture.markers)} />)}
      </GlassCard>
    </View>
  );
}

function SyncScreen({ lectures, pairing, syncStep, syncMessage, syncingLectureId, pendingUpdate, error, onPair, onSyncLecture, onFetchUpdate, onApplyUpdate, onSyncAll }: { lectures: Lecture[]; pairing: PairingPayload | null; syncStep: SyncProgressStep; syncMessage: string | null; syncingLectureId: string | null; pendingUpdate: { lectureId: string; conflict: boolean; update: WindowsUpdatePackage } | null; error: string | null; onPair: (raw: string) => void; onSyncLecture: (lecture: Lecture) => void; onFetchUpdate: (lecture: Lecture) => void; onApplyUpdate: (lectureId: string, source: "windows" | "mobile") => void; onSyncAll: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualQr, setManualQr] = useState("");
  const unsynced = lectures.filter((lecture) => lecture.syncStatus !== "synced");
  const synced = lectures.filter((lecture) => lecture.syncStatus === "synced");

  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Local Sync" title="Windowsと接続" description="講義音声はクラウドに送信されません。同じWi-Fi内のWindows版にだけ転送されます。" />
      {error ? <ErrorBanner message={error} /> : null}

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
          <View style={styles.actionGrid}><GlassButton variant="primary" onPress={() => onApplyUpdate(pendingUpdate.lectureId, "windows")}>Windows版を使う</GlassButton><GlassButton onPress={() => onApplyUpdate(pendingUpdate.lectureId, "mobile")}>スマホ版を使う</GlassButton></View>
        </GlassCard>
      ) : null}

      <GlassCard solid style={styles.listCard}>
        <View style={styles.listHeader}><Text style={styles.cardTitle}>未同期の講義</Text><StatusPill label={`${unsynced.length}件`} tone="amber" /></View>
        {unsynced.length === 0 ? <Text style={styles.bodyText}>未同期の講義はありません。</Text> : unsynced.map((lecture) => <SyncLectureRow key={lecture.id} lecture={lecture} syncing={syncingLectureId === lecture.id} onPress={() => onSyncLecture(lecture)} />)}
        <GlassButton variant="primary" onPress={onSyncAll} disabled={!pairing || unsynced.length === 0}>すべて同期</GlassButton>
      </GlassCard>

      <GlassCard solid style={styles.listCard}>
        <View style={styles.listHeader}><Text style={styles.cardTitle}>Windowsから受信可能な更新</Text><StatusPill label="desktop_final" tone="green" /></View>
        {lectures.length === 0 ? <Text style={styles.bodyText}>講義がありません。</Text> : lectures.map((lecture) => <View key={lecture.id} style={styles.syncLectureRow}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{lecture.title}</Text><Text style={styles.bodyText}>{lecture.transcriptionStatus === "desktop_final" ? "高精度版を保持中" : "Windows側の更新を確認できます"}</Text></View><GlassButton onPress={() => onFetchUpdate(lecture)} disabled={!pairing}>更新確認</GlassButton></View>)}
      </GlassCard>

      <GlassCard solid style={styles.listCard}>
        <View style={styles.listHeader}><Text style={styles.cardTitle}>同期済み</Text><StatusPill label={`${synced.length}件`} tone="green" /></View>
        {synced.length === 0 ? <Text style={styles.bodyText}>同期済み講義はまだありません。</Text> : synced.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} onPress={() => undefined} />)}
      </GlassCard>
    </View>
  );
}

function SyncProgressCard({ step, message }: { step: SyncProgressStep; message: string | null }) {
  return (
    <GlassCard style={styles.formCard}>
      <Text style={styles.eyebrow}>Sync Progress</Text>
      <Text style={styles.cardTitle}>{message ?? syncStepLabel(step)}</Text>
      <Text style={styles.bodyText}>Windows版の同期画面を開いたまま、同じWi-Fi内で待機してください。</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${syncProgressPercent(step)}%` }]} /></View>
    </GlassCard>
  );
}

function SyncLectureRow({ lecture, syncing, onPress }: { lecture: Lecture; syncing: boolean; onPress: () => void }) {
  return (
    <View style={styles.syncLectureRow}>
      <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{lecture.title}</Text><Text style={styles.bodyText}>{lecture.course} ・ {lecture.audioFile}</Text></View>
      <GlassButton onPress={onPress} disabled={syncing}>{syncing ? "同期中" : "同期"}</GlassButton>
    </View>
  );
}

function SettingsScreen({ audioMode, transcriptionSettings, liveInsightSettings, onAudioModeChange, onTranscriptionSettingsChange, onLiveInsightSettingsChange }: { audioMode: AudioMode; transcriptionSettings: MobileTranscriptionSettings; liveInsightSettings: LiveInsightSettings; onAudioModeChange: (mode: AudioMode) => void; onTranscriptionSettingsChange: (settings: MobileTranscriptionSettings) => void; onLiveInsightSettingsChange: (settings: LiveInsightSettings) => void }) {
  return (
    <View style={styles.stack}>
      <ScreenHeader eyebrow="Settings" title="録音設定" description="スマホで保存する音声モードを選びます。実Opus変換は後でネイティブ処理に差し替えます。" />
      <GlassCard solid style={styles.formCard}>{audioModeOptions.map((option) => <Pressable key={option.id} onPress={() => onAudioModeChange(option.id)} style={[styles.optionRow, option.id === audioMode && styles.optionActive]}><View><Text style={styles.cardTitle}>{option.title}</Text><Text style={styles.bodyText}>{option.description}</Text></View><Text style={styles.optionSize}>約{option.estimated90MinMb}MB</Text></Pressable>)}</GlassCard>
      <ScreenHeader eyebrow="Local Transcription" title="スマホ文字起こし" description="whisper.cpp / whisper.rn系のローカル処理を想定した設定です。結果はmobile_draftとして保存されます。" />
      <GlassCard solid style={styles.formCard}>
        {mobileWhisperModels.map((model) => <Pressable key={model.id} onPress={() => onTranscriptionSettingsChange({ ...transcriptionSettings, model: model.id })} style={[styles.optionRow, model.id === transcriptionSettings.model && styles.optionActive]}><View><Text style={styles.cardTitle}>{model.title}</Text><Text style={styles.bodyText}>{model.description}</Text></View></Pressable>)}
        <SettingToggle label="充電中のみ高負荷処理" checked={transcriptionSettings.chargingOnly} onPress={() => onTranscriptionSettingsChange({ ...transcriptionSettings, chargingOnly: !transcriptionSettings.chargingOnly })} />
        <SettingToggle label="文字起こし完了後に通知" checked={transcriptionSettings.notifyOnComplete} onPress={() => onTranscriptionSettingsChange({ ...transcriptionSettings, notifyOnComplete: !transcriptionSettings.notifyOnComplete })} />
        <SettingToggle label="スマホ文字起こしは下書き扱い" checked={transcriptionSettings.draftMode} onPress={() => onTranscriptionSettingsChange({ ...transcriptionSettings, draftMode: !transcriptionSettings.draftMode })} />
        <SettingToggle label="Windows同期後に高精度化" checked={transcriptionSettings.refineOnWindowsSync} onPress={() => onTranscriptionSettingsChange({ ...transcriptionSettings, refineOnWindowsSync: !transcriptionSettings.refineOnWindowsSync })} />
      </GlassCard>
      <ScreenHeader eyebrow="Live Insight" title="ライブ要約" description="完全リアルタイムではなく、少し遅れて安定して今の話を短く表示します。" />
      <GlassCard solid style={styles.formCard}>
        <SettingToggle label="ライブ要約を有効にする" checked={liveInsightSettings.enabled} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, enabled: !liveInsightSettings.enabled })} />
        <Text style={styles.inputLabel}>更新間隔</Text>
        <View style={styles.optionInline}>{([15, 30, 60] as const).map((sec) => <Pressable key={sec} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, updateIntervalSec: sec })} style={[styles.smallOption, liveInsightSettings.updateIntervalSec === sec && styles.optionActive]}><Text style={styles.optionSize}>{sec}秒</Text></Pressable>)}</View>
        <Text style={styles.inputLabel}>要約対象範囲</Text>
        <View style={styles.optionInline}>{([30, 60, 90] as const).map((sec) => <Pressable key={sec} onPress={() => onLiveInsightSettingsChange({ ...liveInsightSettings, windowSec: sec })} style={[styles.smallOption, liveInsightSettings.windowSec === sec && styles.optionActive]}><Text style={styles.optionSize}>{sec}秒</Text></Pressable>)}</View>
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

function LiveInsightCard({ insight, error, settings }: { insight?: LiveLectureInsight; error: string | null; settings: LiveInsightSettings }) {
  if (!settings.enabled) return null;
  if (error) return <GlassCard style={styles.liveCard}><Text style={styles.cardTitle}>ライブ解説</Text><Text style={styles.errorText}>{error}</Text></GlassCard>;
  if (!insight) return <GlassCard style={styles.liveCard}><Text style={styles.cardTitle}>ライブ解説を準備中</Text><Text style={styles.bodyText}>録音を続けると、直近の話を少し遅れて短く表示します。</Text></GlassCard>;

  return (
    <GlassCard style={styles.liveCard}>
      <View style={styles.listHeader}><Text style={styles.cardTitle}>ライブ解説</Text><Text style={styles.markerTime}>{formatTimestamp(insight.start)} - {formatTimestamp(insight.end)}</Text></View>
      {settings.showSummary ? <><Text style={styles.inputLabel}>今の話の要約</Text><Text style={styles.liveText}>{insight.shortSummary}</Text></> : null}
      {settings.showSimpleExplanation ? <><Text style={styles.inputLabel}>やさしい説明</Text><Text style={styles.liveText}>{insight.simpleExplanation}</Text></> : null}
      {settings.showKeyTerms ? <View style={styles.termRow}>{insight.keyTerms.map((term) => <Text key={term} style={styles.termChip}>{term}</Text>)}</View> : null}
      <View style={styles.pillRow}>{settings.showExamLikely && insight.examLikely ? <StatusPill label="試験に出そう" tone="amber" /> : null}{settings.showAssignmentLikely && insight.assignmentLikely ? <StatusPill label="課題っぽい" tone="blue" /> : null}</View>
      <Text style={styles.helpText}>この解説は {formatTimestamp(insight.start)}〜{formatTimestamp(insight.end)} の文字起こしをもとに生成されています。</Text>
    </GlassCard>
  );
}

function TranscriptionProgressCard({ step, message, lectureTitle, model }: { step: TranscriptionProgressStep; message: string | null; lectureTitle: string; model: string }) {
  const label = message ?? transcriptionStepLabel(step);
  return (
    <GlassCard style={styles.formCard}>
      <Text style={styles.eyebrow}>On-device transcription</Text>
      <Text style={styles.cardTitle}>{label}</Text>
      <Text style={styles.bodyText}>{lectureTitle} ・ {model}モデル ・ 外部APIには送信しません</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progressPercent(step)}%` }]} /></View>
    </GlassCard>
  );
}

function TranscriptRow({ segment, marker }: { segment: TranscriptSegment; marker?: LectureMarker }) {
  return (
    <View style={[styles.transcriptRow, marker && styles.transcriptRowMarked]}>
      <Text style={styles.transcriptTime}>{formatTimestamp(segment.start)}</Text>
      <View style={styles.transcriptBody}><Text style={styles.transcriptText}>{segment.text}</Text>{marker ? <StatusPill label={marker.label} tone={marker.type === "confused" ? "rose" : marker.type === "important" ? "amber" : "blue"} /> : null}</View>
    </View>
  );
}

function SettingToggle({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.toggleRow}><Text style={styles.cardTitle}>{label}</Text><View style={[styles.toggle, checked && styles.toggleOn]}><View style={[styles.toggleKnob, checked && styles.toggleKnobOn]} /></View></Pressable>;
}

function findNearbyMarker(segment: TranscriptSegment, markers: LectureMarker[]) {
  return markers.find((marker) => marker.time >= segment.start - 20 && marker.time <= segment.end + 45);
}

function transcriptionStatusLabel(status: Lecture["transcriptionStatus"]) {
  const labels: Record<Lecture["transcriptionStatus"], string> = { not_started: "未処理", preprocessing: "前処理中", transcribing: "文字起こし中", mobile_draft: "スマホ下書き", desktop_refining: "Windows高精度化中", desktop_final: "高精度完了", failed: "失敗" };
  return labels[status];
}

function transcriptionStepLabel(step: TranscriptionProgressStep) {
  const labels: Record<TranscriptionProgressStep, string> = { idle: "待機中", preparing_audio: "音声を準備中", loading_model: "モデルを読み込み中", transcribing: "ローカル文字起こし中", saving_transcript: "文字起こし結果を保存中", completed: "完了", failed: "失敗" };
  return labels[step];
}

function progressPercent(step: TranscriptionProgressStep) {
  const values: Record<TranscriptionProgressStep, number> = { idle: 0, preparing_audio: 18, loading_model: 36, transcribing: 72, saving_transcript: 88, completed: 100, failed: 100 };
  return values[step];
}

function syncStepLabel(step: SyncProgressStep) {
  const labels: Record<SyncProgressStep, string> = { idle: "待機中", checking_connection: "接続確認中", sending_metadata: "講義メタデータを送信中", sending_audio: "音声ファイルを送信中", sending_transcript: "文字起こしを送信中", sending_markers: "マーカーを送信中", saving_on_windows: "Windows側で保存中", completed: "同期完了", failed: "同期失敗" };
  return labels[step];
}

function syncProgressPercent(step: SyncProgressStep) {
  const values: Record<SyncProgressStep, number> = { idle: 0, checking_connection: 12, sending_metadata: 28, sending_audio: 54, sending_transcript: 72, sending_markers: 84, saving_on_windows: 94, completed: 100, failed: 100 };
  return values[step];
}

function ScreenHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <View><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text></View>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <View style={styles.miniStat}><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue}>{value}</Text></View>;
}

function LectureCard({ lecture, onPress }: { lecture: Lecture; onPress: () => void }) {
  return <Pressable onPress={onPress}><GlassCard style={styles.lectureCard}><Text style={styles.cardTitle}>{lecture.title}</Text><Text style={styles.bodyText}>{lecture.course} ・ {formatDuration(lecture.durationSec)} ・ {lecture.markers.length}マーカー</Text><View style={styles.pillRow}><StatusPill label="mobile" tone="violet" /><StatusPill label={lecture.syncStatus === "synced" ? "同期済み" : "未同期"} tone="amber" /></View></GlassCard></Pressable>;
}

function MarkerButton({ label, tone, onPress }: { label: string; tone: "rose" | "amber" | "blue"; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.markerButton, styles[`${tone}Marker`], pressed && styles.pressed]}><Text style={styles.markerText}>{label}</Text></Pressable>;
}

function MarkerRow({ marker }: { marker: LectureMarker }) {
  return <View style={styles.markerListRow}><Text style={styles.markerListLabel}>{marker.label}</Text><Text style={styles.markerTime}>{formatTimestamp(marker.time)}</Text></View>;
}

function TextInputField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (text: string) => void }) {
  return <View style={styles.inputWrap}><Text style={styles.inputLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} style={styles.input} placeholderTextColor="#94a3b8" /></View>;
}

function ErrorBanner({ message }: { message: string }) {
  return <View style={styles.errorBanner}><Text style={styles.errorText}>{message}</Text></View>;
}

function FloatingTabBar({ active, onChange }: { active: MobileScreen; onChange: (screen: MobileScreen) => void }) {
  const items: { id: MobileScreen; label: string }[] = [{ id: "home", label: "ホーム" }, { id: "recording", label: "録音" }, { id: "detail", label: "講義" }, { id: "sync", label: "同期" }, { id: "settings", label: "設定" }];
  return <View style={styles.tabBar}>{items.map((item) => <Pressable key={item.id} onPress={() => onChange(item.id)} style={[styles.tabItem, active === item.id && styles.tabActive]}><Text style={[styles.tabText, active === item.id && styles.tabTextActive]}>{item.label}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f7fbff" },
  shell: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 112 },
  stack: { gap: 16 },
  bgCircleTop: { position: "absolute", top: -80, left: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(125,211,252,0.34)" },
  bgCircleBottom: { position: "absolute", bottom: -100, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(196,181,253,0.32)" },
  eyebrow: { fontSize: 12, fontWeight: "900", letterSpacing: 2.4, color: "#0369a1", textTransform: "uppercase" },
  title: { marginTop: 8, fontSize: 34, lineHeight: 39, fontWeight: "800", color: colors.slate950, letterSpacing: -0.8 },
  description: { marginTop: 8, fontSize: 15, lineHeight: 24, color: colors.slate500 },
  heroCard: { padding: 18, flexDirection: "row", gap: 16, alignItems: "center" },
  recordStart: { width: 94, height: 94, borderRadius: 47, backgroundColor: colors.rose, alignItems: "center", justifyContent: "center", shadowColor: colors.rose, shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 16 } },
  recordStartIcon: { color: "white", fontSize: 32 },
  heroText: { flex: 1 },
  eyebrowRose: { fontSize: 11, fontWeight: "900", letterSpacing: 1.8, color: colors.rose, textTransform: "uppercase" },
  heroTitle: { marginTop: 4, fontSize: 23, fontWeight: "800", color: colors.slate950, letterSpacing: -0.3 },
  bodyText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: colors.slate500 },
  statGrid3: { flexDirection: "row", gap: 8 },
  statGrid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  miniStat: { flex: 1, minWidth: 92, borderRadius: 20, padding: 12, backgroundColor: "rgba(255,255,255,0.62)", borderWidth: 1, borderColor: "rgba(255,255,255,0.7)" },
  miniLabel: { fontSize: 10, fontWeight: "800", color: "#94a3b8" },
  miniValue: { marginTop: 4, fontSize: 12, fontWeight: "900", color: colors.slate950 },
  smallCard: { flex: 1, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.slate950 },
  bigNumber: { marginVertical: 8, fontSize: 34, fontWeight: "800", color: colors.slate950 },
  smallValue: { marginVertical: 10, fontSize: 15, fontWeight: "900", color: colors.slate950 },
  sectionTitle: { fontSize: 19, fontWeight: "800", color: colors.slate950, marginTop: 2 },
  emptyCard: { padding: 18 },
  lectureCard: { padding: 16 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  recordingCard: { padding: 20, alignItems: "center", gap: 12 },
  recStatus: { fontSize: 13, color: colors.rose, fontWeight: "900" },
  timer: { fontSize: 54, fontWeight: "700", color: colors.slate950, letterSpacing: -1.2 },
  estimate: { fontSize: 12, color: colors.slate500, fontWeight: "700" },
  markerRow: { flexDirection: "row", gap: 10 },
  markerButton: { flex: 1, minHeight: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.72)" },
  roseMarker: { backgroundColor: "rgba(255,228,230,0.86)" },
  amberMarker: { backgroundColor: "rgba(254,243,199,0.90)" },
  blueMarker: { backgroundColor: "rgba(224,242,254,0.90)" },
  markerText: { fontSize: 14, fontWeight: "900", color: colors.slate950 },
  pressed: { transform: [{ scale: 0.96 }] },
  feedback: { alignSelf: "center", borderRadius: 999, overflow: "hidden", paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "rgba(15,23,42,0.92)", color: "white", fontSize: 13, fontWeight: "800" },
  actionGrid: { flexDirection: "row", gap: 12 },
  listCard: { padding: 16, gap: 10 },
  markerListRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 18, padding: 12, backgroundColor: "#f8fafc" },
  markerListLabel: { fontSize: 14, fontWeight: "800", color: colors.slate700 },
  markerTime: { fontSize: 12, fontWeight: "900", color: colors.slate500 },
  formCard: { padding: 16, gap: 14 },
  inputWrap: { borderRadius: 20, padding: 12, backgroundColor: "#f8fafc" },
  inputLabel: { fontSize: 11, fontWeight: "800", color: colors.slate500 },
  input: { marginTop: 4, fontSize: 15, fontWeight: "700", color: colors.slate950, padding: 0 },
  fullButton: { marginTop: 4 },
  helpText: { fontSize: 13, lineHeight: 21, color: colors.slate500 },
  optionRow: { borderRadius: 22, padding: 14, backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  optionActive: { backgroundColor: "#e0f2fe", borderWidth: 1, borderColor: "#bae6fd" },
  optionSize: { fontSize: 12, fontWeight: "900", color: "#0369a1" },
  errorBanner: { borderRadius: 22, padding: 14, backgroundColor: "#ffe4e6" },
  errorText: { color: "#be123c", fontSize: 13, lineHeight: 20, fontWeight: "700" },
  tabBar: { position: "absolute", left: 18, right: 18, bottom: 20, minHeight: 64, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: "rgba(255,255,255,0.86)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 7, shadowColor: "#0f172a", shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 12 },
  tabItem: { flex: 1, height: 50, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: colors.slate950 },
  tabText: { fontSize: 11, fontWeight: "900", color: colors.slate500 },
  tabTextActive: { color: "white" },
  progressTrack: { height: 9, borderRadius: 999, overflow: "hidden", backgroundColor: "rgba(226,232,240,0.9)", marginTop: 10 },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#38bdf8" },
  playbackBar: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.slate950, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  playbackText: { color: "white", fontSize: 13, fontWeight: "800" },
  playbackTime: { color: "#bae6fd", fontSize: 12, fontWeight: "900" },
  transcriptRow: { flexDirection: "row", gap: 12, borderRadius: 22, padding: 14, backgroundColor: "#ffffff" },
  transcriptRowMarked: { backgroundColor: "#f0f9ff", borderWidth: 1, borderColor: "#bae6fd" },
  transcriptTime: { width: 48, fontSize: 12, fontWeight: "900", color: "#0284c7" },
  transcriptBody: { flex: 1, gap: 8 },
  transcriptText: { fontSize: 15, lineHeight: 25, color: colors.slate700, fontWeight: "500" },
  toggleRow: { borderRadius: 22, padding: 14, backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  toggle: { width: 48, height: 28, borderRadius: 999, backgroundColor: "#cbd5e1", padding: 3 },
  toggleOn: { backgroundColor: colors.sky },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "white" },
  toggleKnobOn: { transform: [{ translateX: 20 }] },
  cameraBox: { height: 220, borderRadius: 28, overflow: "hidden", backgroundColor: colors.slate950, borderWidth: 1, borderColor: "rgba(255,255,255,0.7)" },
  camera: { flex: 1 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  syncLectureRow: { borderRadius: 22, padding: 14, backgroundColor: "#f8fafc", flexDirection: "row", alignItems: "center", gap: 12 },
  liveCard: { padding: 16, gap: 10 },
  liveText: { fontSize: 14, lineHeight: 22, color: colors.slate700, fontWeight: "600" },
  termRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  termChip: { overflow: "hidden", borderRadius: 999, backgroundColor: "#ede9fe", color: "#6d28d9", paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: "900" },
  optionInline: { flexDirection: "row", gap: 8 },
  smallOption: { flex: 1, borderRadius: 18, padding: 12, alignItems: "center", backgroundColor: "#f8fafc" },
});
