"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CirclePause,
  CircleStop,
  ClipboardList,
  Cloud,
  Edit3,
  ExternalLink,
  FileAudio2,
  HelpCircle,
  Laptop,
  ListChecks,
  Mic,
  Play,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AudioImportPanel } from "@/components/AudioImportPanel";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { ErrorCard } from "@/components/feedback/ErrorCard";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { ProgressCard } from "@/components/feedback/ProgressCard";
import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { LectureCard } from "@/components/LectureCard";
import { MarkerButton } from "@/components/MarkerButton";
import { ObsidianExportPanel } from "@/components/ObsidianExportPanel";
import { RecordingOrb } from "@/components/RecordingOrb";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { SettingsSection } from "@/components/SettingsSection";
import { StatusPill } from "@/components/StatusPill";
import { SummaryPanel } from "@/components/SummaryPanel";
import { SyncDeviceCard } from "@/components/SyncDeviceCard";
import { TimestampRow } from "@/components/TimestampRow";
import { buildLectureMarkdown } from "@/lib/markdown/buildLectureMarkdown";
import { defaultObsidianSettings, loadLectureMarkdown, loadLectureNotes, loadObsidianSettings, saveLectureMarkdown, saveLectureNote, saveObsidianSettings } from "@/lib/obsidian/obsidianStore";
import { generateLectureSummary } from "@/lib/summary/generateLectureNote";
import { formatDuration, formatJapaneseDate, formatTimestamp } from "@/lib/formatTime";
import { audioModeOptions, createLecture, defaultAudioMode, deleteLecture, getAudioModeShortLabel, loadAudioMode, loadLectures, loadMarkersByLecture, loadTranscriptByLecture, saveAudioMode, saveLectures, saveMarkersByLecture, saveTranscriptByLecture, updateLecture } from "@/lib/lectureStore";
import { buildSearchIndex } from "@/services/search/buildSearchIndex";
import { answerGlobalStudyQuestion } from "@/services/chat/globalStudyChat";
import { answerLectureQuestion } from "@/services/chat/lectureChat";
import { loadGlobalChatHistory, loadLectureChatHistory, saveGlobalChatHistory, saveLectureChatHistory } from "@/services/chat/chatHistoryStore";
import { buildWeakPoints } from "@/services/study/buildWeakPoints";
import { generateQuizQuestions } from "@/services/study/generateQuizQuestions";
import { generateStudyCardsFromLecture } from "@/services/study/generateStudyCards";
import { loadQuizQuestions, loadReminderSettings, loadStudyCards, loadStudySessions, saveQuizQuestions, saveReminderSettings, saveStudyCards, saveStudySessions } from "@/services/study/studyStorage";
import { cancelJob, enqueueJob } from "@/services/jobs/jobQueue";
import { loadJobs } from "@/services/jobs/jobStorage";
import type { Job } from "@/services/jobs/jobTypes";
import { copyableLogs, addLog } from "@/services/logger/logger";
import { loadLogs, type AppLog } from "@/services/logger/logStorage";
import { searchLectures } from "@/services/search/searchLectures";
import { buildCourses, buildKeyTerms, buildReviewQueue, buildTags } from "@/services/search/studyCollections";
import { loadLlmSettings, saveLlmSettings, defaultLlmSettings, providerDefaults } from "@/lib/llm/llmSettings";
import type { LlmSettings, LlmProvider } from "@/lib/llm/llmSettings";
import { saveAudio, deleteAudio } from "@/services/recording/recordingStorage";
import { useRecordingController } from "@/services/recording/useRecordingController";
import type { RecordingResult } from "@/services/recording/recordingService";
import { formatDurationMs } from "@/lib/formatTime";
import type { AppScreen, AudioMode, ChatMessage, Course, CreateLectureInput, DetailTab, KeyTerm, Lecture, LectureMarker, LectureNote, LectureTag, MarkerType, ObsidianSettings, QuizQuestion, ReminderSettings, ReviewQueueItem, SearchResult, StudyCard, StudySession, SummaryGenerationStep, TranscriptSegment, WeakPoint } from "@/types/lecture";

const detailTabs: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "transcript", label: "文字起こし" },
  { id: "timeline", label: "タイムライン" },
  { id: "review", label: "復習" },
  { id: "obsidian", label: "Obsidian" },
];

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("recording");
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [audioMode, setAudioMode] = useState<AudioMode>(defaultAudioMode);
  const [notes, setNotes] = useState<Record<string, LectureNote>>({});
  const [markdownByLecture, setMarkdownByLecture] = useState<Record<string, string>>({});
  const [obsidianSettings, setObsidianSettings] = useState<ObsidianSettings>(defaultObsidianSettings);
  const [llmSettings, setLlmSettings] = useState<LlmSettings>(loadLlmSettings);
  const [generationStep, setGenerationStep] = useState<SummaryGenerationStep>("idle");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [transcribingLectureId, setTranscribingLectureId] = useState<string | null>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [jumpTimestamp, setJumpTimestamp] = useState<number | undefined>();
  const [lectureChats, setLectureChats] = useState<Record<string, ChatMessage[]>>({});
  const [globalChat, setGlobalChat] = useState<ChatMessage[]>([]);
  const [studyCards, setStudyCards] = useState<StudyCard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(loadReminderSettings());
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [showCardBack, setShowCardBack] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [markersByLecture, setMarkersByLecture] = useState<Record<string, LectureMarker[]>>({});
  const [transcriptByLecture, setTranscriptByLecture] = useState<Record<string, TranscriptSegment[]>>({});

  useEffect(() => {
    queueMicrotask(() => {
      const storedLectures = loadLectures();
      setLectures(storedLectures);
      setSelectedLectureId(storedLectures[0]?.id ?? null);
      setScreen(storedLectures.length === 0 ? "recording" : "home");
      setAudioMode(loadAudioMode());
      setNotes(loadLectureNotes());
      setMarkdownByLecture(loadLectureMarkdown());
      setObsidianSettings(loadObsidianSettings());
      setLectureChats(loadLectureChatHistory());
      setGlobalChat(loadGlobalChatHistory());
      setStudyCards(loadStudyCards());
      setQuizQuestions(loadQuizQuestions());
      setStudySessions(loadStudySessions());
      setReminderSettings(loadReminderSettings());
      setJobs(loadJobs());
      setLogs(loadLogs());
      setMarkersByLecture(loadMarkersByLecture());
      setTranscriptByLecture(loadTranscriptByLecture());
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) saveLectures(lectures);
  }, [isLoaded, lectures]);

  useEffect(() => {
    if (isLoaded) saveAudioMode(audioMode);
  }, [audioMode, isLoaded]);

  useEffect(() => {
    if (isLoaded) saveObsidianSettings(obsidianSettings);
  }, [isLoaded, obsidianSettings]);

  useEffect(() => {
    if (isLoaded) saveMarkersByLecture(markersByLecture);
  }, [isLoaded, markersByLecture]);

  useEffect(() => {
    if (isLoaded) saveTranscriptByLecture(transcriptByLecture);
  }, [isLoaded, transcriptByLecture]);

  const selectedLecture = useMemo(
    () => lectures.find((lecture) => lecture.id === selectedLectureId) ?? lectures[0],
    [lectures, selectedLectureId],
  );

  const tagsByLecture = useMemo(() => buildTags(lectures, notes, markersByLecture), [lectures, markersByLecture, notes]);
  const courses = useMemo(() => buildCourses(lectures, notes, markersByLecture, tagsByLecture), [lectures, markersByLecture, notes, tagsByLecture]);
  const reviewQueue = useMemo(() => buildReviewQueue(lectures, notes, markersByLecture), [lectures, markersByLecture, notes]);
  const keyTerms = useMemo(() => buildKeyTerms(lectures, notes), [lectures, notes]);
  const weakPoints = useMemo(() => buildWeakPoints({ lectures, markersByLecture, cards: studyCards }), [lectures, markersByLecture, studyCards]);
  const searchIndex = useMemo(() => buildSearchIndex({ lectures, transcriptByLecture, notesByLecture: notes, markersByLecture, tagsByLecture }), [lectures, markersByLecture, notes, tagsByLecture, transcriptByLecture]);

  const openDetail = (lectureId: string, tab: DetailTab = "overview") => {
    setSelectedLectureId(lectureId);
    setJumpTimestamp(undefined);
    setDetailTab(tab);
    setScreen("detail");
  };

  const openSearchResult = (result: SearchResult) => {
    setSelectedLectureId(result.lectureId);
    setJumpTimestamp(result.timestamp);
    setDetailTab(result.timestamp !== undefined ? "transcript" : "overview");
    setScreen("detail");
  };

  const handleCreateLecture = (input: CreateLectureInput) => {
    const lecture = createLecture(input);
    setLectures((current) => [lecture, ...current]);
    setSelectedLectureId(lecture.id);
    setDetailTab("overview");
    setScreen("detail");
    if (lecture.durationSec > 0) {
      triggerTranscription(lecture.id, lecture.durationSec);
    }
  };

  const handleDeleteLecture = (lectureId: string) => {
    const lecture = lectures.find((l) => l.id === lectureId);
    if (lecture?.audioKey) deleteAudio(lecture.audioKey).catch(() => undefined);
    setLectures((current) => {
      const updated = deleteLecture(current, lectureId);
      if (selectedLectureId === lectureId) {
        setSelectedLectureId(updated[0]?.id ?? null);
        setScreen(updated.length === 0 ? "recording" : "home");
      }
      return updated;
    });
    setMarkersByLecture((prev) => { const next = { ...prev }; delete next[lectureId]; return next; });
    setTranscriptByLecture((prev) => { const next = { ...prev }; delete next[lectureId]; return next; });
    setNotes((prev) => { const next = { ...prev }; delete next[lectureId]; return next; });
  };

  const handleUpdateLecture = useCallback((lectureId: string, patch: Partial<Lecture>) => {
    setLectures((current) => updateLecture(current, lectureId, patch));
  }, []);

  const triggerTranscription = useCallback(async (lectureId: string, durationSec: number) => {
    try {
      setTranscribingLectureId(lectureId);
      setTranscriptionProgress(0);
      setLectures((current) => updateLecture(current, lectureId, { transcriptionStatus: "transcribing" }));
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId, durationSec: Math.max(durationSec, 60) }),
      });
      const data = await res.json() as { ok: boolean; segments?: TranscriptSegment[]; error?: string };
      if (!data.ok || !data.segments) throw new Error(data.error ?? "文字起こしに失敗しました。");
      setTranscriptByLecture((prev) => ({ ...prev, [lectureId]: data.segments! }));
      setLectures((current) => updateLecture(current, lectureId, { transcriptionStatus: "mobile_draft" }));
      addLog({ level: "info", area: "transcription", message: `文字起こし完了: ${data.segments.length}セグメント` });
      setLogs(loadLogs());
    } catch (error) {
      setLectures((current) => updateLecture(current, lectureId, { transcriptionStatus: "failed" }));
      addLog({ level: "error", area: "transcription", message: error instanceof Error ? error.message : "文字起こし処理に失敗しました。" });
      setLogs(loadLogs());
    } finally {
      setTranscribingLectureId(null);
      setTranscriptionProgress(0);
    }
  }, []);

  useEffect(() => {
    if (!transcribingLectureId) return;
    const interval = setInterval(() => {
      setTranscriptionProgress((prev) => Math.min(prev + Math.random() * 8 + 2, 95));
    }, 1000);
    return () => clearInterval(interval);
  }, [transcribingLectureId]);

  const handleCreateLectureFromRecording = useCallback(async (title: string, course: string, result: RecordingResult, audioMode: AudioMode) => {
    const now = new Date().toISOString();
    const audioKey = `recording_${Date.now()}`;
    await saveAudio(audioKey, result.blob);

    const input: CreateLectureInput = {
      title: title || "新しい講義",
      course: course || "未設定の科目",
      recordedAt: now,
      audioMode,
      audioFile: audioKey,
      durationSec: Math.round(result.durationMs / 1000),
      source: "recording",
      audioKey,
      audioMimeType: result.mimeType,
    };

    const lecture = createLecture(input);
    setLectures((current) => [lecture, ...current]);
    setSelectedLectureId(lecture.id);

    if (result.markers.length > 0) {
      const lectureMarkers: LectureMarker[] = result.markers.map((m) => ({
        time: Math.round(m.timeMs / 1000),
        type: m.type as MarkerType,
        label: m.label,
      }));
      setMarkersByLecture((prev) => ({ ...prev, [lecture.id]: lectureMarkers }));
    }

    addLog({ level: "info", area: "recording", message: `録音を完了: ${lecture.title}` });
    setLogs(loadLogs());

    triggerTranscription(lecture.id, Math.max(result.durationMs / 1000, 60));

    setDetailTab("overview");
    setScreen("detail");
  }, [triggerTranscription]);

  const handleGenerateNote = async (lecture: Lecture) => {
    setGenerationError(null);
    const transcript = transcriptByLecture[lecture.id] ?? [];
    const markers = markersByLecture[lecture.id] ?? [];

    try {
      if (transcript.length === 0) throw new Error("文字起こしがまだありません。先に録音または音声取り込みを完了してください。");

      setGenerationStep("chunking_transcript");

      const note = await generateLectureSummary(lecture, transcript, markers, { provider: llmSettings.provider !== "mock" ? llmSettings.provider : "mock", llmSettings });
      setGenerationStep("generating_markdown");
      const markdown = buildLectureMarkdown(lecture, note, transcript, markers, obsidianSettings);

      saveLectureNote(note);
      saveLectureMarkdown(lecture.id, markdown);
      setNotes((current) => ({ ...current, [lecture.id]: note }));
      setMarkdownByLecture((current) => ({ ...current, [lecture.id]: markdown }));
      setLectures((current) => updateLecture(current, lecture.id, { summaryStatus: "generated" }));

      fetch("/api/lecture-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId: lecture.id, noteJson: note, markdown }),
      }).catch(() => undefined);

      setGenerationStep("completed");
    } catch (error) {
      setGenerationStep("failed");
      setGenerationError(error instanceof Error ? error.message : "自動メモ生成に失敗しました。");
    }
  };

  const handleLectureQuestion = async (question: string) => {
    if (!selectedLecture) return;
    const userMessage = createChatMessage("user", question);
    const current = [...(lectureChats[selectedLecture.id] ?? []), userMessage];
    setLectureChats((prev) => ({ ...prev, [selectedLecture.id]: current }));
    try {
      const answer = await answerLectureQuestion({ lecture: selectedLecture, question, transcript: transcriptByLecture[selectedLecture.id] ?? [], note: notes[selectedLecture.id], markers: markersByLecture[selectedLecture.id] ?? [] });
      const assistant = createChatMessage("assistant", answer.message, answer.references);
      const next = [...current, assistant];
      setLectureChats((prev) => ({ ...prev, [selectedLecture.id]: next }));
      saveLectureChatHistory(selectedLecture.id, next);
    } catch (error) {
      const assistant = createChatMessage("assistant", error instanceof Error ? error.message : "AI回答生成に失敗しました。", []);
      const next = [...current, assistant];
      setLectureChats((prev) => ({ ...prev, [selectedLecture.id]: next }));
      saveLectureChatHistory(selectedLecture.id, next);
    }
  };

  const handleGlobalQuestion = async (question: string) => {
    const userMessage = createChatMessage("user", question);
    const current = [...globalChat, userMessage];
    setGlobalChat(current);
    try {
      const answer = await answerGlobalStudyQuestion({ question, lectures, searchIndex });
      const assistant = createChatMessage("assistant", answer.message, answer.references);
      const next = [...current, assistant];
      setGlobalChat(next);
      saveGlobalChatHistory(next);
    } catch (error) {
      const assistant = createChatMessage("assistant", error instanceof Error ? error.message : "関連する内容が見つかりませんでした。", []);
      const next = [...current, assistant];
      setGlobalChat(next);
      saveGlobalChatHistory(next);
    }
  };

  const generateStudyContent = () => {
    const cards = lectures.flatMap((lecture) => generateStudyCardsFromLecture({ lecture, transcript: transcriptByLecture[lecture.id] ?? [], note: notes[lecture.id], markers: markersByLecture[lecture.id] ?? [] }));
    const quizzes = lectures.flatMap((lecture) => generateQuizQuestions({ lecture, transcript: transcriptByLecture[lecture.id] ?? [], note: notes[lecture.id], markers: markersByLecture[lecture.id] ?? [] }));
    setStudyCards(cards);
    setQuizQuestions(quizzes);
    saveStudyCards(cards);
    saveQuizQuestions(quizzes);
    setActiveCardIndex(0);
    setActiveQuizIndex(0);
  };

  const updateCardStatus = (cardId: string, status: StudyCard["status"]) => {
    const cards = studyCards.map((card) => card.id === cardId ? { ...card, status, updatedAt: new Date().toISOString() } : card);
    setStudyCards(cards);
    saveStudyCards(cards);
    setShowCardBack(false);
    setActiveCardIndex((index) => Math.min(index + 1, Math.max(cards.length - 1, 0)));
  };

  const answerQuiz = (answer: string) => {
    setQuizAnswer(answer);
    const question = quizQuestions[activeQuizIndex];
    if (!question) return;
    const session: StudySession = { id: `session_${Date.now()}`, startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), cardIds: [], quizQuestionIds: [question.id], correctCount: answer === question.answer ? 1 : 0, wrongCount: answer === question.answer ? 0 : 1 };
    const sessions = [session, ...studySessions];
    setStudySessions(sessions);
    saveStudySessions(sessions);
  };

  const saveReminder = (settings: ReminderSettings) => {
    setReminderSettings(settings);
    saveReminderSettings(settings);
  };

  const addDiagnosticJob = (type: Job["type"], message: string) => {
    const job = enqueueJob({ type, message });
    setJobs(loadJobs());
    addLog({ level: "info", area: "ui", message: `診断ジョブを追加: ${job.type}` });
    setLogs(loadLogs());
  };

  const cancelDiagnosticJob = (jobId: string) => {
    cancelJob(jobId);
    setJobs(loadJobs());
  };

  return (
    <AppShell>
      <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24 pt-9">
          {screen === "home" ? <HomeScreen lectures={lectures} audioMode={audioMode} onRecord={() => setScreen("recording")} onOpenDetail={(lectureId) => openDetail(lectureId, "overview")} onCreateLecture={handleCreateLecture} onNavigate={setScreen} /> : null}
          {screen === "recording" ? <RecordingScreen lecture={selectedLecture} audioMode={audioMode} onImport={() => setScreen("home")} onRecordingComplete={handleCreateLectureFromRecording} onBack={() => setScreen("home")} /> : null}
          {screen === "detail" ? selectedLecture ? <LectureDetailScreen lecture={selectedLecture} note={notes[selectedLecture.id]} markdown={markdownByLecture[selectedLecture.id]} obsidianSettings={obsidianSettings} transcript={transcriptByLecture[selectedLecture.id] ?? []} markers={markersByLecture[selectedLecture.id] ?? []} generationStep={generationStep} generationError={generationError} jumpTimestamp={jumpTimestamp} onCourseOpen={(course) => { setSelectedCourse(course); setScreen("courseDetail"); }} onOpenChat={() => setScreen("lectureChat")} onGenerateNote={handleGenerateNote} onTabChange={setDetailTab} activeTab={detailTab} onDeleteLecture={handleDeleteLecture} onUpdateLecture={handleUpdateLecture} onBack={() => setScreen("home")} transcriptionProgress={transcribingLectureId === selectedLecture.id ? transcriptionProgress : null} /> : <NoLectureSelected onRecord={() => setScreen("recording")} /> : null}
          {screen === "sync" ? <SyncScreen onBack={() => setScreen("home")} /> : null}
          {screen === "search" ? <SearchScreen index={searchIndex} courses={courses} tags={Object.values(tagsByLecture).flat()} onOpenResult={openSearchResult} onBack={() => setScreen("home")} /> : null}
          {screen === "courses" ? <CoursesScreen courses={courses} onOpenCourse={(course) => { setSelectedCourse(course.name); setScreen("courseDetail"); }} onBack={() => setScreen("home")} /> : null}
          {screen === "courseDetail" ? <CourseDetailScreen courseName={selectedCourse ?? courses[0]?.name ?? ""} lectures={lectures} courses={courses} notes={notes} markersByLecture={markersByLecture} onOpenLecture={(lectureId) => openDetail(lectureId)} onBack={() => setScreen("courses")} /> : null}
          {screen === "reviewQueue" ? <ReviewQueueScreen items={reviewQueue} onOpenItem={(item) => { setSelectedLectureId(item.lectureId); setJumpTimestamp(item.timestamp); setDetailTab(item.timestamp ? "transcript" : "overview"); setScreen("detail"); }} onBack={() => setScreen("home")} /> : null}
          {screen === "tags" ? <TagsScreen tagsByLecture={tagsByLecture} selectedTag={selectedTag} lectures={lectures} onSelectTag={setSelectedTag} onOpenLecture={(lectureId) => openDetail(lectureId)} onBack={() => setScreen("home")} /> : null}
          {screen === "keyTerms" ? <KeyTermsScreen terms={keyTerms} onOpenTerm={(term) => { setSelectedLectureId(term.lectureIds[0]); setJumpTimestamp(term.timestamps[0]?.timestamp); setDetailTab("transcript"); setScreen("detail"); }} onBack={() => setScreen("home")} /> : null}
          {screen === "lectureChat" ? selectedLecture ? <LectureChatScreen lecture={selectedLecture} messages={lectureChats[selectedLecture.id] ?? []} onAsk={handleLectureQuestion} onReference={(lectureId, timestamp) => { setSelectedLectureId(lectureId); setJumpTimestamp(timestamp); setDetailTab("transcript"); setScreen("detail"); }} onBack={() => setScreen("detail")} /> : <NoLectureSelected onRecord={() => setScreen("recording")} /> : null}
          {screen === "globalChat" ? <GlobalChatScreen messages={globalChat} onAsk={handleGlobalQuestion} onReference={(lectureId, timestamp) => { setSelectedLectureId(lectureId); setJumpTimestamp(timestamp); setDetailTab("transcript"); setScreen("detail"); }} onBack={() => setScreen("home")} /> : null}
          {screen === "studyHome" ? <StudyHomeScreen cards={studyCards} quizzes={quizQuestions} queue={reviewQueue} weakPoints={weakPoints} lectures={lectures} onGenerate={generateStudyContent} onNavigate={setScreen} onBack={() => setScreen("home")} /> : null}
          {screen === "flashcards" ? <FlashcardsScreen cards={studyCards} activeIndex={activeCardIndex} showBack={showCardBack} onFlip={() => setShowCardBack((value) => !value)} onStatus={updateCardStatus} onGenerate={generateStudyContent} onOpenLecture={(lectureId, timestamp) => { setSelectedLectureId(lectureId); setJumpTimestamp(timestamp); setDetailTab("transcript"); setScreen("detail"); }} onBack={() => setScreen("studyHome")} /> : null}
          {screen === "quiz" ? <QuizScreen questions={quizQuestions} activeIndex={activeQuizIndex} selectedAnswer={quizAnswer} onAnswer={answerQuiz} onNext={() => { setQuizAnswer(null); setActiveQuizIndex((index) => Math.min(index + 1, Math.max(quizQuestions.length - 1, 0))); }} onGenerate={generateStudyContent} onBack={() => setScreen("studyHome")} /> : null}
          {screen === "examMode" ? <ExamModeScreen cards={studyCards} questions={quizQuestions} weakPoints={weakPoints} queue={reviewQueue} courses={courses} onOpenLecture={(lectureId, timestamp) => { setSelectedLectureId(lectureId); setJumpTimestamp(timestamp); setDetailTab("transcript"); setScreen("detail"); }} onBack={() => setScreen("studyHome")} /> : null}
          {screen === "weakPoints" ? <WeakPointsScreen weakPoints={weakPoints} onOpenLecture={(lectureId, timestamp) => { setSelectedLectureId(lectureId); setJumpTimestamp(timestamp); setDetailTab("transcript"); setScreen("detail"); }} onAsk={(lectureId) => { setSelectedLectureId(lectureId); setScreen("lectureChat"); }} onBack={() => setScreen("studyHome")} /> : null}
          {screen === "reminders" ? <ReminderSettingsScreen settings={reminderSettings} courses={courses} onChange={saveReminder} onBack={() => setScreen("settings")} /> : null}
          {screen === "settings" ? <SettingsScreen audioMode={audioMode} obsidianSettings={obsidianSettings} llmSettings={llmSettings} jobs={jobs} logs={logs} lectures={lectures} onAudioModeChange={setAudioMode} onObsidianSettingsChange={setObsidianSettings} onLlmSettingsChange={(settings: LlmSettings) => { saveLlmSettings(settings); setLlmSettings(settings); }} onAddJob={addDiagnosticJob} onCancelJob={cancelDiagnosticJob} onRefreshDiagnostics={() => { setJobs(loadJobs()); setLogs(loadLogs()); }} onBack={() => setScreen("home")} /> : null}
        </div>
        <FloatingTabBar active={screen} onChange={setScreen} />
      </div>
    </AppShell>
  );
}

function ScreenHeader({ eyebrow, title, description, onBack }: { eyebrow: string; title: string; description?: string; onBack?: () => void }) {
  return (
    <header className="mb-5">
      <div className="flex items-center gap-3">
        {onBack ? <button onClick={onBack} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/65 text-slate-600 shadow-sm backdrop-blur-2xl transition-all active:scale-95 hover:bg-white/80" aria-label="戻る"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></button> : null}
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700/80">{eyebrow}</p>
          <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-slate-950">{title}</h1>
        </div>
      </div>
      {description ? <p className="mt-2 text-[15px] leading-7 text-slate-600">{description}</p> : null}
    </header>
  );
}

function HomeScreen({
  lectures,
  audioMode,
  onRecord,
  onOpenDetail,
  onCreateLecture,
  onNavigate,
}: {
  lectures: Lecture[];
  audioMode: AudioMode;
  onRecord: () => void;
  onOpenDetail: (lectureId: string) => void;
  onCreateLecture: (input: CreateLectureInput) => void;
  onNavigate: (screen: AppScreen) => void;
}) {
  if (lectures.length === 0) {
    return (
      <div className="space-y-5">
        <ScreenHeader eyebrow="Welcome" title="講義を1本追加しましょう" description="サンプルは表示しません。録音するか、手元の音声ファイルを取り込むだけで始められます。" />
        <FeedbackEmptyState title="まだ講義がありません" message="最初の講義を追加すると、文字起こし、復習ノート、Obsidian出力、LAN同期を使えるようになります。" />
        <div className="grid grid-cols-2 gap-3">
          <GlassButton onClick={onRecord} variant="primary"><Mic className="h-4 w-4" />録音する</GlassButton>
          <GlassButton onClick={() => {
            const panel = document.getElementById("audio-import-panel");
            panel?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}><FileAudio2 className="h-4 w-4" />下から取り込む</GlassButton>
        </div>
        <AudioImportPanel audioMode={audioMode} onCreateLecture={onCreateLecture} panelId="audio-import-panel" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow={formatJapaneseDate(new Date().toISOString())} title="講義を記録する" description="録音、文字起こし、復習ノートまで自動で整理します。" />

      <GlassCard className="relative overflow-hidden p-5">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <button onClick={onRecord} className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-400 via-red-500 to-orange-400 text-white shadow-[0_22px_60px_rgba(244,63,94,0.38)] ring-8 ring-white/45 transition-all active:scale-95" aria-label="録音開始">
            <Mic className="h-9 w-9" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Ready</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">新しい講義を録音</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">スマホでもWindowsでも開始できます。</p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
          <MiniStat label="音声" value={getAudioModeShortLabel(audioMode)} />
          <MiniStat label="文字起こし" value="ローカル" />
          <MiniStat label="同期" value="Windows待機中" />
        </div>
      </GlassCard>

      <AudioImportPanel audioMode={audioMode} onCreateLecture={onCreateLecture} />

      <div className="grid grid-cols-3 gap-2">
        <QuickNav label="検索" onClick={() => onNavigate("search")} />
        <QuickNav label="AI相談" onClick={() => onNavigate("globalChat")} />
        <QuickNav label="学習" onClick={() => onNavigate("studyHome")} />
        <QuickNav label="科目" onClick={() => onNavigate("courses")} />
        <QuickNav label="復習" onClick={() => onNavigate("reviewQueue")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <Cloud className="h-5 w-5 text-violet-600" />
          <p className="mt-3 text-sm font-bold text-slate-900">Obsidian</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Vault: University Notes</p>
          <StatusPill tone="green">接続済み</StatusPill>
        </GlassCard>
        <GlassCard className="p-4">
          <Laptop className="h-5 w-5 text-sky-600" />
          <p className="mt-3 text-sm font-bold text-slate-900">Windows Sync</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">高精度化を待機中</p>
          <StatusPill status="windows_pending" />
        </GlassCard>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-950">最近の講義</h2>
          <button onClick={() => onNavigate("courses")} className="text-xs font-bold text-sky-700">すべて見る</button>
        </div>
        <div className="space-y-3">
          {lectures.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} onClick={() => onOpenDetail(lecture.id)} />)}
        </div>
      </section>
    </div>
  );
}

function QuickNav({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-[22px] border border-white/65 bg-white/55 px-3 py-4 text-sm font-black text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-all active:scale-[0.97]">{label}</button>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/55 px-2 py-3 shadow-inner">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 truncate text-[11px] font-black text-slate-800">{value}</p>
    </div>
  );
}

function RecordingScreen({ lecture, audioMode, onImport, onRecordingComplete, onBack }: { lecture?: Lecture; audioMode: AudioMode; onImport: () => void; onRecordingComplete: (title: string, course: string, result: RecordingResult, audioMode: AudioMode) => Promise<void>; onBack: () => void }) {
  const ctrl = useRecordingController();
  const [title, setTitle] = useState(lecture?.title ?? "");
  const [course, setCourse] = useState(lecture?.course ?? "");
  const isRecording = ctrl.status === "recording";
  const isPaused = ctrl.status === "paused";
  const isIdle = ctrl.status === "idle";
  const isFinalizing = ctrl.status === "finalizing";
  const hasError = ctrl.status === "error";

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isRecording || isPaused) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isRecording, isPaused]);

  const handleStop = async () => {
    try {
      const result = await ctrl.stop();
      await onRecordingComplete(title, course, result, audioMode);
    } catch {
      // error handled by controller
    }
  };

  if (!ctrl.supported) {
    return (
      <div className="space-y-5">
        <ScreenHeader eyebrow="Recording" title="録音" description="Webブラウザからの録音には対応していません。" onBack={onBack} />
        <ErrorCard title="このブラウザは録音に対応していません" message="Chrome, Edge, Firefox のいずれかをお使いください。Safari は一部制限があります。" />
        <GlassButton onClick={onImport} variant="primary" className="w-full"><FileAudio2 className="h-4 w-4" />音声ファイルを取り込む</GlassButton>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow="Recording" title={isRecording ? "録音中" : isPaused ? "一時停止中" : isFinalizing ? "保存中..." : "最初の講義を録音"} description="講義に集中できるよう、録音中は余計な表示を減らします。" onBack={onBack} />

      {hasError ? <ErrorCard title="録音でエラーが発生しました" message={ctrl.error ?? "不明なエラーです。"} actionLabel="もう一度試す" onRetry={() => ctrl.start(audioMode)} /> : null}

      <GlassCard className="p-6 text-center">
        <p className="text-sm font-bold text-rose-600">{lecture?.title ?? (title || "録音準備完了")}</p>
        <div className="mt-2 text-5xl font-semibold tracking-tight text-slate-950 tabular-nums">{formatDurationMs(ctrl.elapsedMs)}</div>
        <div className={`mx-auto mt-1 h-1.5 w-16 rounded-full ${isRecording ? "bg-rose-500" : isPaused ? "bg-amber-400" : "bg-rose-300"}`} />
        <div className="mt-2 flex justify-center"><RecordingOrb status={isRecording ? "recording" : isPaused ? "paused" : "idle"} /></div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <FileAudio2 className="h-4 w-4" /> {getAudioModeShortLabel(audioMode)} ・ クラウド送信なし
        </div>
      </GlassCard>

      {isIdle ? (
        <GlassCard solid className="p-5">
          <h3 className="text-lg font-bold text-slate-950">講義情報を入力</h3>
          <div className="mt-3 grid gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-500">講義タイトル</span>
              <input className="w-full rounded-2xl border border-white/70 bg-white/78 px-4 py-3 text-sm font-semibold text-slate-800 shadow-inner outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="講義タイトル" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-500">科目名</span>
              <input className="w-full rounded-2xl border border-white/70 bg-white/78 px-4 py-3 text-sm font-semibold text-slate-800 shadow-inner outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="科目名" />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <GlassButton variant="primary" onClick={() => ctrl.start(audioMode)}><Mic className="h-4 w-4" />録音開始</GlassButton>
            <GlassButton onClick={onImport}><FileAudio2 className="h-4 w-4" />音声を取り込む</GlassButton>
          </div>
        </GlassCard>
      ) : null}

      {isRecording || isPaused ? (
        <>
          <div className="flex gap-3">
            <MarkerButton label="わからない" icon={HelpCircle} tone="rose" onClick={() => ctrl.addMarker("confused", "わからない")} />
            <MarkerButton label="重要" icon={Star} tone="amber" onClick={() => ctrl.addMarker("important", "重要")} />
            <MarkerButton label="課題" icon={ClipboardList} tone="sky" onClick={() => ctrl.addMarker("task", "課題")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {isRecording ? <GlassButton onClick={ctrl.pause}><CirclePause className="h-5 w-5" />一時停止</GlassButton> : <GlassButton onClick={ctrl.resume}><Play className="h-5 w-5" />再開</GlassButton>}
            <GlassButton variant="danger" onClick={handleStop} disabled={isFinalizing}><CircleStop className="h-5 w-5" />停止</GlassButton>
          </div>
          {ctrl.markers.length > 0 ? (
            <GlassCard solid className="p-4">
              <h3 className="text-base font-bold text-slate-900">マーカー ({ctrl.markers.length}件)</h3>
              <div className="mt-3 space-y-2">
                {ctrl.markers.map((m, i) => (
                  <div key={`${m.type}-${i}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700">{m.label}</span>
                    <span className="text-xs font-bold tabular-nums text-slate-400">{formatDurationMs(m.timeMs)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : null}
        </>
      ) : null}

      {isFinalizing ? <ProgressCard title="音声を保存中" message="録音データを保存しています。しばらくお待ちください。" progress={50} /> : null}
    </div>
  );
}

function NoLectureSelected({ onRecord }: { onRecord: () => void }) {
  return <div className="space-y-4"><FeedbackEmptyState title="講義がまだありません" message="まずは録音するか、既存の音声ファイルを取り込んでください。" /><GlassButton onClick={onRecord} variant="primary" className="w-full"><Mic className="h-4 w-4" />録音画面へ</GlassButton></div>;
}

function LectureDetailScreen({
  lecture,
  note,
  markdown,
  obsidianSettings,
  transcript,
  markers,
  generationStep,
  generationError,
  jumpTimestamp,
  activeTab,
  onTabChange,
  onCourseOpen,
  onOpenChat,
  onGenerateNote,
  onDeleteLecture,
  onUpdateLecture,
  onBack,
  transcriptionProgress,
}: {
  lecture: Lecture;
  note?: LectureNote;
  markdown?: string;
  obsidianSettings: ObsidianSettings;
  transcript: TranscriptSegment[];
  markers: LectureMarker[];
  generationStep: SummaryGenerationStep;
  generationError: string | null;
  jumpTimestamp?: number;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onCourseOpen: (course: string) => void;
  onOpenChat: () => void;
  onGenerateNote: (lecture: Lecture) => void;
  onDeleteLecture: (lectureId: string) => void;
  onUpdateLecture: (lectureId: string, patch: Partial<Lecture>) => void;
  onBack: () => void;
  transcriptionProgress: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(lecture.title);
  const [editCourse, setEditCourse] = useState(lecture.course);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const startEditing = () => {
    setEditTitle(lecture.title);
    setEditCourse(lecture.course);
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdateLecture(lecture.id, { title: editTitle.trim() || lecture.title, course: editCourse.trim() || lecture.course });
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-2">
                <input className="w-full rounded-2xl border border-white/70 bg-white/78 px-4 py-2 text-lg font-bold text-slate-800 shadow-inner outline-none" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="講義タイトル" />
                <input className="w-full rounded-2xl border border-white/70 bg-white/78 px-4 py-2 text-sm font-semibold text-slate-800 shadow-inner outline-none" value={editCourse} onChange={(e) => setEditCourse(e.target.value)} placeholder="科目名" />
                <div className="flex gap-2">
                  <GlassButton onClick={saveEdit} variant="primary">保存</GlassButton>
                  <GlassButton onClick={() => setEditing(false)}>キャンセル</GlassButton>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => onCourseOpen(lecture.course)} className="text-xs font-black uppercase tracking-[0.22em] text-violet-700/80">{lecture.course}</button>
                <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-tight text-slate-950">{lecture.title}</h1>
              </>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {!editing && (
              <>
                <button onClick={startEditing} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/65 text-slate-600 shadow-md backdrop-blur-2xl transition-all active:scale-95 hover:bg-white/80" aria-label="編集"><Edit3 className="h-5 w-5" /></button>
                {showDeleteConfirm ? (
                  <div className="flex gap-2">
                    <button onClick={() => { onDeleteLecture(lecture.id); setShowDeleteConfirm(false); }} className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-md transition-all active:scale-95">削除</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="rounded-2xl bg-white/65 px-4 py-2 text-sm font-bold text-slate-600 shadow-md backdrop-blur-2xl transition-all active:scale-95">取消</button>
                  </div>
                ) : (
                  <button onClick={() => setShowDeleteConfirm(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/65 text-rose-500 shadow-md backdrop-blur-2xl transition-all active:scale-95 hover:bg-white/80" aria-label="削除"><Trash2 className="h-5 w-5" /></button>
                )}
              </>
            )}
          </div>
        </div>
        <GlassCard className="p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MetaItem label="科目" value={lecture.course} />
            <MetaItem label="録音時間" value={formatDuration(lecture.durationSec)} />
            <MetaItem label="音声サイズ" value={`${lecture.audioSizeMb}MB`} />
            <MetaItem label="音声" value={getAudioModeShortLabel(lecture.audioMode)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill status={lecture.audioStatus} />
            <StatusPill status={lecture.transcriptionStatus} />
            <StatusPill status={lecture.summaryStatus} />
            <StatusPill status={lecture.obsidianExportStatus} />
            <StatusPill status={lecture.syncStatus} />
          </div>
          {transcriptionProgress !== null && lecture.transcriptionStatus === "transcribing" ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>文字起こし中...</span>
                <span>{Math.round(transcriptionProgress)}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-sky-400 transition-all duration-1000" style={{ width: `${transcriptionProgress}%` }} />
              </div>
            </div>
          ) : null}
          {lecture.note ? <p className="mt-3 rounded-2xl bg-white/55 px-3 py-3 text-sm leading-6 text-slate-600">{lecture.note}</p> : null}
        </GlassCard>
      </header>

      <SegmentedTabs items={detailTabs} active={activeTab} onChange={onTabChange} />
      <GlassButton onClick={onOpenChat} variant="primary" className="w-full"><Star className="h-4 w-4" />この講義について質問する</GlassButton>

      {activeTab === "overview" ? <OverviewTab lecture={lecture} note={note} hasTranscript={transcript.length > 0} generationStep={generationStep} generationError={generationError} onGenerateNote={() => onGenerateNote(lecture)} onOpenObsidian={() => onTabChange("obsidian")} /> : null}
      {activeTab === "transcript" ? <TranscriptTab transcript={transcript} jumpTimestamp={jumpTimestamp} audioKey={lecture.audioKey} /> : null}
      {activeTab === "timeline" ? <TimelineTab note={note} markers={markers} /> : null}
      {activeTab === "review" ? <ReviewTab note={note} generationStep={generationStep} generationError={generationError} onGenerateNote={() => onGenerateNote(lecture)} /> : null}
      {activeTab === "obsidian" ? <ObsidianExportPanel lecture={lecture} note={note} markdown={markdown} settings={obsidianSettings} transcript={transcript} markers={markers} onGenerateNote={() => onGenerateNote(lecture)} onExportSuccess={() => onUpdateLecture(lecture.id, { obsidianExportStatus: "exported" })} /> : null}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white/55 p-3"><p className="text-[11px] font-bold text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-800">{value}</p></div>;
}

function OverviewTab({ lecture, note, hasTranscript, generationStep, generationError, onGenerateNote, onOpenObsidian }: { lecture: Lecture; note?: LectureNote; hasTranscript: boolean; generationStep: SummaryGenerationStep; generationError: string | null; onGenerateNote: () => void; onOpenObsidian: () => void }) {
  const confusingParts = note?.confusingParts ?? [];
  const keyPoints = note?.keyPoints ?? [];

  return (
    <div className="space-y-4">
      <SummaryPanel title="要約">
        {note ? note.summary : hasTranscript ? "文字起こしが完了しました。自動メモを生成すると要約が表示されます。" : "音声ファイルは講義として登録済みです。文字起こしを完了すると、要約・復習ノートを自動生成できます。"}
      </SummaryPanel>
      <GenerationPanel hasNote={Boolean(note)} hasTranscript={hasTranscript} step={generationStep} error={generationError} onGenerate={onGenerateNote} />
      <GlassCard solid className="p-5">
        <h3 className="text-lg font-bold text-slate-900">処理ステータス</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <StatusBox label="音声" status={lecture.audioStatus} />
          <StatusBox label="文字起こし" status={lecture.transcriptionStatus} />
          <StatusBox label="要約" status={lecture.summaryStatus} />
          <StatusBox label="Obsidian" status={lecture.obsidianExportStatus} />
        </div>
      </GlassCard>
      {keyPoints.length > 0 ? <GlassCard solid className="p-5"><h3 className="text-lg font-bold text-slate-900">重要ポイント</h3><div className="mt-3 space-y-2">{keyPoints.map((point) => <CheckLine key={point}>{point}</CheckLine>)}</div></GlassCard> : null}
      {confusingParts.length > 0 ? <GlassCard className="p-5"><h3 className="text-lg font-bold text-slate-900">わからなかった場所</h3><p className="mt-2 text-sm leading-7 text-slate-600">{confusingParts[0]?.title} - {confusingParts[0]?.explanation}</p></GlassCard> : null}
      <div className="grid gap-3">
        <GlassButton onClick={onGenerateNote} disabled={!hasTranscript}><SparkleIcon />{note ? "再生成" : "自動メモを生成"}</GlassButton>
        <GlassButton onClick={onOpenObsidian}><ExternalLink className="h-4 w-4" />Obsidianへ出力</GlassButton>
      </div>
    </div>
  );
}

function GenerationPanel({ hasNote, hasTranscript, step, error, onGenerate }: { hasNote: boolean; hasTranscript: boolean; step: SummaryGenerationStep; error: string | null; onGenerate: () => void }) {
  const isGenerating = !["idle", "completed", "failed"].includes(step);
  const progressMap: Record<SummaryGenerationStep, number> = {
    idle: hasNote ? 100 : 0,
    chunking_transcript: 18,
    generating_summary: 38,
    extracting_key_points: 55,
    building_timeline: 70,
    generating_quiz: 84,
    generating_markdown: 94,
    completed: 100,
    failed: 0,
  };
  const labelMap: Record<SummaryGenerationStep, string> = {
    idle: hasNote ? "自動メモ生成済み" : "まだ自動メモが生成されていません",
    chunking_transcript: "transcript.jsonをチャンク化中",
    generating_summary: "要約を生成中",
    extracting_key_points: "重要ポイントを抽出中",
    building_timeline: "タイムラインを作成中",
    generating_quiz: "復習問題を作成中",
    generating_markdown: "Markdownを生成中",
    completed: "完了",
    failed: "失敗",
  };

  if (error || step === "failed") {
    return <ErrorCard title="自動メモを生成できませんでした" message={error ?? "文字起こしデータを確認して、もう一度試してください。"} actionLabel="再生成する" onRetry={onGenerate} />;
  }

  if (isGenerating) {
    return <ProgressCard title={labelMap[step]} message="文字起こし、マーカー、講義情報から復習用ノートを生成しています。" progress={progressMap[step]} />;
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Auto Notes</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{labelMap[step]}</h3>
          {error ? <p className="mt-2 text-sm leading-6 text-rose-600">{error}</p> : <p className="mt-2 text-sm leading-6 text-slate-500">文字起こし、マーカー、講義情報から復習用ノートを生成します。</p>}
        </div>
        <GlassButton onClick={onGenerate} variant={hasNote ? "secondary" : "primary"} disabled={isGenerating || !hasTranscript}>{isGenerating ? "処理中" : hasNote ? "再生成" : "生成"}</GlassButton>
      </div>
    </GlassCard>
  );
}

function SparkleIcon() {
  return <Star className="h-4 w-4" />;
}

function StatusBox({ label, status }: { label: string; status: React.ComponentProps<typeof StatusPill>["status"] }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="mb-2 text-[11px] font-bold text-slate-400">{label}</p><StatusPill status={status} /></div>;
}

function CheckLine({ children }: { children: React.ReactNode }) {
  return <p className="flex gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{children}</p>;
}

function TranscriptTab({ transcript, jumpTimestamp, audioKey }: { transcript: TranscriptSegment[]; jumpTimestamp?: number; audioKey?: string }) {
  const [showAll, setShowAll] = useState(false);
  const [playerTime, setPlayerTime] = useState<number | undefined>();
  const visibleSegments = showAll ? transcript : transcript.slice(0, 24);
  const hiddenCount = transcript.length - visibleSegments.length;

  if (transcript.length === 0) {
    return (
      <div className="space-y-4">
        <FeedbackEmptyState title="文字起こしはまだありません" message="録音を停止すると自動で文字起こしが始まります。既存の音声ファイルを取り込んでもOKです。" />
      </div>
    );
  }

  const activeTime = jumpTimestamp ?? playerTime;

  return (
    <div className="space-y-4">
      <AudioPlayer audioKey={audioKey} onTimeUpdate={setPlayerTime} jumpTimestamp={jumpTimestamp} />
      <GlassCard solid className="p-4">
        <div className="flex items-center justify-between rounded-[22px] bg-slate-950 px-4 py-3 text-white">
          <span className="flex items-center gap-2 text-sm font-bold"><Play className="h-4 w-4" />文字起こし</span>
          <span className="text-sm font-bold tabular-nums">{visibleSegments.length} / {transcript.length}</span>
        </div>
        {activeTime !== undefined ? <p className="mt-3 rounded-2xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">{formatTimestamp(activeTime)} 付近</p> : null}
        <div className="mt-3 space-y-2">{visibleSegments.map((segment) => <TimestampRow key={`${segment.start}-${segment.end}`} segment={{ ...segment, active: activeTime !== undefined ? Math.abs(segment.start - activeTime) < 60 : segment.active }} />)}</div>
        {hiddenCount > 0 ? <GlassButton onClick={() => setShowAll(true)} className="mt-3 w-full">全文を読み込む（残り{hiddenCount}件）</GlassButton> : null}
      </GlassCard>
    </div>
  );
}

function TimelineTab({ note, markers }: { note?: LectureNote; markers: LectureMarker[] }) {
  const timeline = note?.timeline ?? [];

  if (timeline.length === 0 && markers.length === 0) {
    return (
      <div className="space-y-3">
        <FeedbackEmptyState title="タイムラインはまだありません" message="自動メモを生成すると、講義の区切りや重要ポイントがタイムラインに表示されます。" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timeline.map((item) => (
        <GlassCard key={item.start} solid className="p-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="rounded-full bg-sky-500 px-2.5 py-1 text-xs font-bold text-white tabular-nums">{formatTimestamp(item.start)}</span>
              <span className="mt-2 h-full w-px bg-slate-200" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          </div>
        </GlassCard>
      ))}
      {markers.map((marker) => (
        <GlassCard key={`${marker.type}-${marker.time}`} solid className="p-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white tabular-nums">{formatTimestamp(marker.time)}</span>
              <span className="mt-2 h-full w-px bg-slate-200" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">{marker.label}</h3>
              <p className="mt-1 text-xs font-bold text-slate-400">{marker.type}</p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function ReviewTab({ note, generationStep, generationError, onGenerateNote }: { note?: LectureNote; generationStep: SummaryGenerationStep; generationError: string | null; onGenerateNote: () => void }) {
  if (!note) {
    return (
      <div className="space-y-4">
        <GlassCard className="p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br from-violet-100 to-sky-100 text-violet-700 shadow-inner">
            <Star className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-950">まだ自動メモが生成されていません</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">transcript.jsonから要約、重要ポイント、復習問題、わからなかった場所の解説を生成できます。</p>
          {generationError ? <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{generationError}</p> : null}
          <GlassButton onClick={onGenerateNote} variant="primary" className="mt-5 w-full" disabled={!(["idle", "completed", "failed"].includes(generationStep))}>{generationStep === "idle" || generationStep === "failed" || generationStep === "completed" ? "自動メモを生成する" : "生成中"}</GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryPanel title="要約">{note.summary}</SummaryPanel>
      <GlassCard solid className="p-5"><h3 className="text-lg font-bold">重要ポイント</h3><div className="mt-3 space-y-2">{note.keyPoints.map((point) => <CheckLine key={point}>{point}</CheckLine>)}</div></GlassCard>
      <GlassCard solid className="p-5"><h3 className="text-lg font-bold">試験に出そうな部分</h3><div className="mt-3 space-y-2">{note.examLikelyPoints.map((point) => <CheckLine key={point}>{point}</CheckLine>)}</div></GlassCard>
      <GlassCard solid className="p-5"><h3 className="text-lg font-bold">復習問題</h3><div className="mt-3 space-y-2">{note.quiz.map((item, i) => <p key={item.question} className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><span className="font-bold text-slate-950">Q{i + 1}. {item.question}</span><br />{item.answer}</p>)}</div></GlassCard>
      <GlassCard className="p-5"><h3 className="flex items-center gap-2 text-lg font-bold"><AlertCircle className="h-5 w-5 text-rose-500" />わからなかった場所</h3><div className="mt-2 space-y-2">{note.confusingParts.map((part) => <p key={part.markerTime} className="rounded-2xl bg-white/58 p-3 text-sm leading-7 text-slate-600"><span className="font-bold text-slate-900">{formatTimestamp(part.markerTime)} {part.title}</span><br />{part.explanation}</p>)}</div></GlassCard>
      <GlassCard solid className="p-5"><h3 className="flex items-center gap-2 text-lg font-bold"><ListChecks className="h-5 w-5 text-emerald-500" />今日復習すること</h3><div className="mt-3 space-y-2">{note.reviewChecklist.map((item) => <CheckLine key={item}>{item}</CheckLine>)}</div></GlassCard>
    </div>
  );
}

function SyncScreen({ onBack }: { onBack: () => void }) {
  const [serverInfo, setServerInfo] = useState<{ baseUrl: string; deviceName: string; pairing: unknown } | null>(null);
  const [receivedLectures, setReceivedLectures] = useState<Lecture[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  const startServer = async () => {
    setSyncError(null);
    try {
      const health = await fetch("/api/sync/health").then((res) => res.json()) as { ok: boolean; baseUrl: string; deviceName: string; pairing: unknown; error?: string };
      if (!health.ok) throw new Error(health.error ?? "同期サーバーを起動できませんでした。");
      setServerInfo({ baseUrl: health.baseUrl, deviceName: health.deviceName, pairing: health.pairing });
      const list = await fetch("/api/sync/lectures").then((res) => res.json()) as { lectures: Lecture[] };
      setReceivedLectures(list.lectures ?? []);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Windows同期サーバーに接続できません。");
    }
  };

  const refreshReceivedLectures = async () => {
    const list = await fetch("/api/sync/lectures").then((res) => res.json()) as { lectures: Lecture[] };
    setReceivedLectures(list.lectures ?? []);
  };

  const refineLecture = async (lectureId: string) => {
    setSyncError(null);
    try {
      const result = await fetch(`/api/sync/lectures/${encodeURIComponent(lectureId)}/refine`, { method: "POST" }).then((res) => res.json()) as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error ?? "高精度再文字起こしに失敗しました。");
      await refreshReceivedLectures();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Windowsでの高精度文字起こしに失敗しました。");
    }
  };

  const qrValue = serverInfo ? JSON.stringify(serverInfo.pairing) : "";

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow="Sync" title="Windowsと同期" description="スマホで録音、Windowsで高精度化。ローカルWi-Fiだけで安全に講義を移動します。" onBack={onBack} />
      <GlassCard className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Local Sync Server</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">Windows同期サーバー</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">講義音声はクラウドに送信されません。同じWi-Fi内のWindows版にだけ転送されます。</p>
          </div>
          <StatusPill tone={serverInfo ? "green" : "slate"}>{serverInfo ? "起動中" : "停止中"}</StatusPill>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <GlassButton onClick={startServer} variant="primary">サーバー起動</GlassButton>
          <GlassButton onClick={() => setServerInfo(null)}>停止</GlassButton>
        </div>
        {syncError ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{syncError}</p> : null}
      </GlassCard>

      {serverInfo ? (
        <GlassCard solid className="p-5 text-center">
          <h3 className="text-lg font-bold text-slate-950">スマホでQRコードを読み取る</h3>
          <div className="mx-auto mt-4 grid h-56 w-56 place-items-center rounded-[30px] bg-white shadow-inner">
            <QRCodeSVG value={qrValue} size={178} bgColor="#ffffff" fgColor="#0f172a" />
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500">{serverInfo.baseUrl}</p>
          <StatusPill tone="green">{serverInfo.deviceName}</StatusPill>
        </GlassCard>
      ) : <SyncDeviceCard />}

      <GlassCard solid className="p-5">
        <h3 className="text-lg font-bold">受信済み講義</h3>
        <div className="mt-3 space-y-2">
          {receivedLectures.length === 0 ? <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">まだ受信した講義はありません。</p> : receivedLectures.map((lecture) => (
            <div key={lecture.id} className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-900">{lecture.title}</span><StatusPill tone="green">受信済み</StatusPill></div>
              <p className="mt-1 text-xs text-slate-500">{lecture.course} ・ {lecture.audioFile}</p>
              {lecture.transcriptionStatus === "mobile_draft" ? <GlassButton onClick={() => refineLecture(lecture.id)} className="mt-3 w-full"><Laptop className="h-4 w-4" />Windowsで高精度再文字起こし</GlassButton> : null}
              {lecture.transcriptionStatus === "desktop_final" ? <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">スマホへ返す高精度版があります</p> : null}
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard solid className="p-5">
        <h3 className="text-lg font-bold">スマホへ返す更新</h3>
        <div className="mt-3 space-y-2">
          {receivedLectures.filter((lecture) => lecture.syncStatus === "update_available" || lecture.transcriptionStatus === "desktop_final").length === 0 ? <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">返送できる更新はありません。</p> : receivedLectures.filter((lecture) => lecture.syncStatus === "update_available" || lecture.transcriptionStatus === "desktop_final").map((lecture) => <p key={lecture.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-sm font-semibold"><span>{lecture.title}</span><StatusPill tone="green">desktop_final</StatusPill></p>)}
        </div>
      </GlassCard>
      <GlassCard solid className="p-5">
        <h3 className="text-lg font-bold">競合中</h3>
        <div className="mt-3 space-y-2">
          {receivedLectures.filter((lecture) => lecture.syncStatus === "conflict").length === 0 ? <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">競合はありません。</p> : receivedLectures.filter((lecture) => lecture.syncStatus === "conflict").map((lecture) => <p key={lecture.id} className="rounded-2xl bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-800">{lecture.title}: どちらを最新版にするか選択が必要です。</p>)}
        </div>
      </GlassCard>
    </div>
  );
}

function SearchScreen({ index, courses, tags, onOpenResult, onBack }: { index: ReturnType<typeof buildSearchIndex>; courses: Course[]; tags: LectureTag[]; onOpenResult: (result: SearchResult) => void; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState<string | undefined>();
  const [tag, setTag] = useState<string | undefined>();
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("classnote-ai:search-history") ?? "[]") as string[]; } catch { return []; }
  });
  const results = searchLectures(index, query, { course, tag, period: "all" });
  const uniqueTags = [...new Set(tags.map((item) => item.name))];

  const saveToHistory = (q: string) => {
    if (!q.trim()) return;
    setHistory((prev) => {
      const next = [q, ...prev.filter((h) => h !== q)].slice(0, 10);
      try { localStorage.setItem("classnote-ai:search-history", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleOpenResult = (result: SearchResult) => {
    saveToHistory(query);
    onOpenResult(result);
  };

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow="Search" title="講義を探す" description="タイトル、科目、文字起こし、要約、マーカーをまとめて検索できます。" onBack={onBack} />
      <div className="rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveToHistory(query); }} className="w-full bg-transparent text-[15px] font-semibold outline-none placeholder:text-slate-400" placeholder="講義を検索..." /></div>
      {history.length > 0 ? <GlassCard className="p-4"><p className="text-xs font-bold text-slate-500">最近の検索</p><div className="mt-2 flex flex-wrap gap-2">{history.map((item) => <button key={item} onClick={() => setQuery(item)} className="rounded-full bg-white/65 px-3 py-2 text-xs font-bold text-slate-700">{item}</button>)}</div></GlassCard> : null}
      <div className="space-y-2"><FilterRow label="科目" values={courses.map((item) => item.name)} active={course} onSelect={setCourse} /><FilterRow label="タグ" values={uniqueTags} active={tag} onSelect={setTag} /></div>
      <GlassCard solid className="p-4"><h3 className="text-lg font-bold text-slate-900">検索結果</h3><div className="mt-3 space-y-2">{results.length === 0 ? <EmptyState text="検索結果がありません。別のキーワードを試してください。" /> : results.map((result) => <SearchResultCard key={`${result.lectureId}-${result.source}-${result.timestamp}-${result.matchedText}`} result={result} query={query} onClick={() => handleOpenResult(result)} />)}</div></GlassCard>
    </div>
  );
}

function FilterRow({ label, values, active, onSelect }: { label: string; values: string[]; active?: string; onSelect: (value: string | undefined) => void }) {
  return <GlassCard className="p-3"><p className="mb-2 text-xs font-bold text-slate-500">{label}</p><div className="flex flex-wrap gap-2"><button onClick={() => onSelect(undefined)} className={`rounded-full px-3 py-2 text-xs font-bold ${!active ? "bg-slate-950 text-white" : "bg-white/65 text-slate-700"}`}>すべて</button>{values.map((value) => <button key={value} onClick={() => onSelect(value)} className={`rounded-full px-3 py-2 text-xs font-bold ${active === value ? "bg-slate-950 text-white" : "bg-white/65 text-slate-700"}`}>{value}</button>)}</div></GlassCard>;
}

function SearchResultCard({ result, query, onClick }: { result: SearchResult; query: string; onClick: () => void }) {
  return <button onClick={onClick} className="w-full rounded-[24px] bg-slate-50 p-4 text-left transition-all active:scale-[0.99]"><div className="flex items-center justify-between gap-3"><h4 className="font-bold text-slate-950">{result.lectureTitle}</h4>{result.timestamp !== undefined ? <span className="rounded-full bg-sky-500 px-2.5 py-1 text-xs font-bold text-white tabular-nums">{formatTimestamp(result.timestamp)}</span> : null}</div><p className="mt-1 text-xs font-semibold text-slate-500">{result.course} ・ {result.source}</p><p className="mt-2 text-sm leading-6 text-slate-700">{highlightText(result.matchedText, query)}</p><div className="mt-2 flex flex-wrap gap-1.5">{result.tags.slice(0, 3).map((tag) => <StatusPill key={tag} tone={tag === "わからない" ? "rose" : tag === "試験に出そう" ? "violet" : "blue"}>{tag}</StatusPill>)}</div></button>;
}

function CoursesScreen({ courses, onOpenCourse, onBack }: { courses: Course[]; onOpenCourse: (course: Course) => void; onBack: () => void }) {
  return <div className="space-y-5"><ScreenHeader eyebrow="Courses" title="科目別に整理" description="講義数、未復習、わからない場所、試験ポイントを科目ごとに確認できます。" onBack={onBack} />{courses.length === 0 ? <EmptyState text="科目がまだありません。講義を録音すると自動で整理されます。" /> : courses.map((course) => <button key={course.id} onClick={() => onOpenCourse(course)} className="w-full text-left"><GlassCard className="p-5"><div className="flex items-start justify-between"><div><h3 className="text-xl font-bold text-slate-950">{course.name}</h3><p className="mt-1 text-sm text-slate-500">最終録音: {course.lastRecordedAt ? formatJapaneseDate(course.lastRecordedAt) : "なし"}</p></div><StatusPill tone="blue">{course.lectureCount}講義</StatusPill></div><div className="mt-4 grid grid-cols-3 gap-2"><MiniStat label="未復習" value={`${course.unreviewedCount}`} /><MiniStat label="わからない" value={`${course.confusingMarkerCount}`} /><MiniStat label="試験" value={`${course.examLikelyPointCount}`} /></div></GlassCard></button>)}</div>;
}

function CourseDetailScreen({ courseName, lectures, courses, notes, markersByLecture, onOpenLecture, onBack }: { courseName: string; lectures: Lecture[]; courses: Course[]; notes: Record<string, LectureNote>; markersByLecture: Record<string, LectureMarker[]>; onOpenLecture: (lectureId: string) => void; onBack: () => void }) {
  const [sort, setSort] = useState<"date" | "unreviewed" | "important">("date");
  const course = courses.find((item) => item.name === courseName);
  const courseLectures = lectures.filter((lecture) => lecture.course === courseName).sort((a, b) => sort === "date" ? b.recordedAt.localeCompare(a.recordedAt) : sort === "unreviewed" ? Number(!notes[b.id]) - Number(!notes[a.id]) : (markersByLecture[b.id]?.length ?? 0) - (markersByLecture[a.id]?.length ?? 0));
  return <div className="space-y-5"><ScreenHeader eyebrow="Course" title={courseName || "科目"} description="復習進捗、重要語句、わからない場所を科目単位で確認します。" onBack={onBack} /><GlassCard className="p-5"><div className="grid grid-cols-3 gap-2"><MiniStat label="講義" value={`${course?.lectureCount ?? 0}`} /><MiniStat label="未復習" value={`${course?.unreviewedCount ?? 0}`} /><MiniStat label="わからない" value={`${course?.confusingMarkerCount ?? 0}`} /></div></GlassCard><FilterRow label="並び替え" values={["date", "unreviewed", "important"]} active={sort} onSelect={(value) => setSort((value as typeof sort) ?? "date")} /><GlassCard solid className="p-4"><h3 className="text-lg font-bold">講義一覧</h3><div className="mt-3 space-y-2">{courseLectures.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} onClick={() => onOpenLecture(lecture.id)} />)}</div></GlassCard><GlassCard className="p-5"><h3 className="text-lg font-bold">試験に出そうなポイント</h3><div className="mt-3 space-y-2">{courseLectures.flatMap((lecture) => notes[lecture.id]?.examLikelyPoints ?? []).slice(0, 6).map((point) => <CheckLine key={point}>{point}</CheckLine>)}</div></GlassCard></div>;
}

function ReviewQueueScreen({ items, onOpenItem, onBack }: { items: ReviewQueueItem[]; onOpenItem: (item: ReviewQueueItem) => void; onBack: () => void }) {
  return <div className="space-y-5"><ScreenHeader eyebrow="Review" title="今日の復習" description="わからないまま残っている箇所と、試験前に見返すべき講義を集めました。" onBack={onBack} />{items.length === 0 ? <EmptyState text="まだ復習が必要な講義はありません。今日の講義を録音すると自動で表示されます。" /> : items.map((item) => <button key={item.id} onClick={() => onOpenItem(item)} className="w-full text-left"><GlassCard solid className="p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-950">{item.title}</h3><StatusPill tone={item.priority === "high" ? "rose" : item.priority === "medium" ? "amber" : "slate"}>{item.priority}</StatusPill></div><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>{item.timestamp !== undefined ? <p className="mt-2 text-xs font-bold text-sky-700">{formatTimestamp(item.timestamp)} から復習する</p> : null}</GlassCard></button>)}</div>;
}

function TagsScreen({ tagsByLecture, selectedTag, lectures, onSelectTag, onOpenLecture, onBack }: { tagsByLecture: Record<string, LectureTag[]>; selectedTag: string | null; lectures: Lecture[]; onSelectTag: (tag: string | null) => void; onOpenLecture: (lectureId: string) => void; onBack: () => void }) {
  const allTags = Object.values(tagsByLecture).flat();
  const names = [...new Set(allTags.map((tag) => tag.name))];
  const filtered = selectedTag ? lectures.filter((lecture) => tagsByLecture[lecture.id]?.some((tag) => tag.name === selectedTag)) : [];
  return <div className="space-y-5"><ScreenHeader eyebrow="Tags" title="タグで整理" description="自動生成タグと手動タグを分けて、講義をすばやく絞り込みます。" onBack={onBack} /><GlassCard className="p-5"><div className="flex flex-wrap gap-2">{names.length === 0 ? <EmptyState text="タグがまだありません。" /> : names.map((name) => <button key={name} onClick={() => onSelectTag(selectedTag === name ? null : name)} className={`rounded-full px-4 py-2 text-sm font-bold ${selectedTag === name ? "bg-slate-950 text-white" : "bg-white/70 text-slate-700"}`}>#{name} <span className="text-xs opacity-70">{allTags.filter((tag) => tag.name === name).length}</span></button>)}</div></GlassCard>{selectedTag ? <GlassCard solid className="p-4"><h3 className="text-lg font-bold">#{selectedTag} の講義</h3><div className="mt-3 space-y-2">{filtered.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} onClick={() => onOpenLecture(lecture.id)} />)}</div></GlassCard> : null}</div>;
}

function KeyTermsScreen({ terms, onOpenTerm, onBack }: { terms: KeyTerm[]; onOpenTerm: (term: KeyTerm) => void; onBack: () => void }) {
  return <div className="space-y-5"><ScreenHeader eyebrow="Terms" title="重要語句" description="講義全体から抽出された用語を、科目・講義・タイムスタンプと一緒に確認します。" onBack={onBack} />{terms.length === 0 ? <EmptyState text="重要語句がまだ生成されていません。自動メモを生成するとここに表示されます。" /> : terms.map((term) => <button key={term.id} onClick={() => onOpenTerm(term)} className="w-full text-left"><GlassCard solid className="p-5"><div className="flex items-center justify-between"><h3 className="text-xl font-bold text-slate-950">{term.term}</h3><StatusPill tone="violet">Obsidian link</StatusPill></div><p className="mt-1 text-sm font-semibold text-slate-500">{term.course}</p><p className="mt-3 text-sm leading-6 text-slate-700">{term.description}</p><p className="mt-3 text-xs font-bold text-sky-700">出現: {term.lectureTitles.join(", ")}</p></GlassCard></button>)}</div>;
}

const lectureQuestionChips = ["この講義を簡単に要約して", "試験に出そうな部分は？", "わからない場所を解説して", "重要語句を教えて", "復習問題を作って", "マーカー箇所を解説して"];
const globalQuestionChips = ["試験に出そうな講義を教えて", "未復習の重要ポイントをまとめて", "わからないマーカーが多い部分を教えて", "全講義から重要語句を抽出して"];

function LectureChatScreen({ lecture, messages, onAsk, onReference, onBack }: { lecture: Lecture; messages: ChatMessage[]; onAsk: (question: string) => void; onReference: (lectureId: string, timestamp?: number) => void; onBack: () => void }) {
  return <ChatScreenShell eyebrow="Lecture Chat" title={lecture.title} description={`${lecture.course} ・ 文字起こしとマーカーをもとに答えます`} messages={messages} chips={lectureQuestionChips} onAsk={onAsk} onReference={onReference} onBack={onBack} emptyText="この講義について質問できます。文字起こし・要約・マーカーをもとに、復習を手伝います。" />;
}

function GlobalChatScreen({ messages, onAsk, onReference, onBack }: { messages: ChatMessage[]; onAsk: (question: string) => void; onReference: (lectureId: string, timestamp?: number) => void; onBack: () => void }) {
  return <ChatScreenShell eyebrow="Study Chat" title="全講義に質問" description="検索と講義データを使って、関連講義を探してから答えます。" messages={messages} chips={globalQuestionChips} onAsk={onAsk} onReference={onReference} onBack={onBack} emptyText="全講義を横断して質問できます。未復習、試験対策、わからない場所をまとめて確認できます。" />;
}

function ChatScreenShell({ eyebrow, title, description, messages, chips, emptyText, onAsk, onReference, onBack }: { eyebrow: string; title: string; description: string; messages: ChatMessage[]; chips: string[]; emptyText: string; onAsk: (question: string) => void; onReference: (lectureId: string, timestamp?: number) => void; onBack: () => void }) {
  const [draft, setDraft] = useState("");
  const submit = (question: string) => {
    const text = question.trim();
    if (!text) return;
    setDraft("");
    onAsk(text);
  };

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow={eyebrow} title={title} description={description} onBack={onBack} />
      <GlassCard className="p-4"><p className="text-xs font-bold text-slate-500">おすすめ質問</p><div className="mt-3 flex flex-wrap gap-2">{chips.map((chip) => <button key={chip} onClick={() => submit(chip)} className="rounded-full bg-white/70 px-3 py-2 text-xs font-bold text-slate-700 shadow-inner">{chip}</button>)}</div></GlassCard>
      <GlassCard solid className="p-4"><div className="space-y-3">{messages.length === 0 ? <EmptyState text={emptyText} /> : messages.map((message) => <ChatBubble key={message.id} message={message} onReference={onReference} />)}</div></GlassCard>
      <div className="sticky bottom-24 rounded-[28px] border border-white/70 bg-white/72 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur-3xl">
        <div className="flex items-center gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(draft); }} className="min-w-0 flex-1 rounded-full bg-white px-4 py-3 text-sm font-semibold outline-none placeholder:text-slate-400" placeholder="講義について質問する" /><button onClick={() => submit(draft)} className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-white transition-all active:scale-95"><Send className="h-4 w-4" /></button></div>
      </div>
    </div>
  );
}

function ChatBubble({ message, onReference }: { message: ChatMessage; onReference: (lectureId: string, timestamp?: number) => void }) {
  const isUser = message.role === "user";
  return <div className={`rounded-[26px] p-4 ${isUser ? "ml-8 bg-slate-950 text-white" : "mr-6 bg-white shadow-inner"}`}><p className={`whitespace-pre-wrap text-sm leading-7 ${isUser ? "text-white" : "text-slate-700"}`}>{message.content}</p>{!isUser && message.references?.length ? <div className="mt-3 space-y-2"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">参照</p>{message.references.map((ref, index) => <button key={`${ref.lectureId}-${ref.timestamp}-${index}`} onClick={() => onReference(ref.lectureId, ref.timestamp)} className="w-full rounded-2xl bg-sky-50 px-3 py-2 text-left text-xs text-sky-900"><span className="font-black">{ref.timestamp !== undefined ? `${formatTimestamp(ref.timestamp)} ` : ""}{ref.lectureTitle}</span><br />{ref.text}</button>)}</div> : null}</div>;
}

function StudyHomeScreen({ cards, quizzes, queue, weakPoints, lectures, onGenerate, onNavigate, onBack }: { cards: StudyCard[]; quizzes: QuizQuestion[]; queue: ReviewQueueItem[]; weakPoints: WeakPoint[]; lectures: Lecture[]; onGenerate: () => void; onNavigate: (screen: AppScreen) => void; onBack: () => void }) {
  const todayCount = cards.filter((card) => card.status === "new" || card.status === "weak" || card.status === "later").length + queue.length;
  return <div className="space-y-5"><ScreenHeader eyebrow="Study" title="今日の復習" description="まずは「わからない」が付いた場所から復習しましょう。" onBack={onBack} /><GlassCard className="p-5"><div className="grid grid-cols-3 gap-2"><MiniStat label="今日" value={`${todayCount}`} /><MiniStat label="カード" value={`${cards.length}`} /><MiniStat label="小テスト" value={`${quizzes.length}`} /></div><div className="mt-4 grid gap-3"><GlassButton variant="primary" onClick={() => onNavigate("flashcards")}>復習カード開始</GlassButton><GlassButton onClick={() => onNavigate("quiz")}>小テスト開始</GlassButton><GlassButton onClick={() => onNavigate("examMode")}>テスト前モード</GlassButton></div></GlassCard><div className="grid grid-cols-2 gap-3"><GlassCard className="p-4"><h3 className="font-bold">未復習の講義</h3><p className="mt-2 text-3xl font-black">{lectures.filter((lecture) => lecture.summaryStatus === "not_started").length}</p></GlassCard><GlassCard className="p-4"><h3 className="font-bold">苦手項目</h3><p className="mt-2 text-3xl font-black">{weakPoints.length}</p></GlassCard></div><GlassCard solid className="p-4"><h3 className="text-lg font-bold">今日復習する項目</h3><div className="mt-3 space-y-2">{queue.slice(0, 5).length === 0 ? <EmptyState text="まだ復習が必要な講義はありません。" /> : queue.slice(0, 5).map((item) => <p key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{item.title}: {item.description}</p>)}</div></GlassCard><div className="grid grid-cols-2 gap-3"><GlassButton onClick={onGenerate}>復習カード生成</GlassButton><GlassButton onClick={() => onNavigate("weakPoints")}>苦手ポイント</GlassButton><GlassButton onClick={() => onNavigate("reminders")}>リマインダー</GlassButton><GlassButton onClick={() => onNavigate("keyTerms")}>重要語句</GlassButton></div></div>;
}

function FlashcardsScreen({ cards, activeIndex, showBack, onFlip, onStatus, onGenerate, onOpenLecture, onBack }: { cards: StudyCard[]; activeIndex: number; showBack: boolean; onFlip: () => void; onStatus: (cardId: string, status: StudyCard["status"]) => void; onGenerate: () => void; onOpenLecture: (lectureId: string, timestamp?: number) => void; onBack: () => void }) {
  const card = cards[activeIndex];
  if (!card) return <div className="space-y-5"><ScreenHeader eyebrow="Cards" title="復習カード" description="講義ノートからカードを作成します。" onBack={onBack} /><EmptyState text="まだ復習カードはありません。講義を文字起こしして、自動メモを生成すると復習カードを作れます。" /><GlassButton onClick={onGenerate} variant="primary">復習カードを生成</GlassButton></div>;
  return <div className="space-y-5"><ScreenHeader eyebrow="Cards" title="復習カード" description={`${activeIndex + 1} / ${cards.length}`} onBack={onBack} /><button onClick={onFlip} className="w-full text-left"><GlassCard solid className="min-h-80 p-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">{showBack ? "Answer" : "Question"}</p><h3 className="mt-4 text-2xl font-bold leading-9 text-slate-950">{showBack ? card.back : card.front}</h3>{showBack && card.explanation ? <p className="mt-4 text-sm leading-7 text-slate-600">{card.explanation}</p> : null}{card.timestamp !== undefined ? <button onClick={(event) => { event.stopPropagation(); onOpenLecture(card.lectureId, card.timestamp); }} className="mt-5 rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">関連: {formatTimestamp(card.timestamp)}</button> : null}</GlassCard></button><div className="grid grid-cols-3 gap-2"><GlassButton onClick={() => onStatus(card.id, "known")}>わかった</GlassButton><GlassButton onClick={() => onStatus(card.id, "weak")}>まだ不安</GlassButton><GlassButton onClick={() => onStatus(card.id, "later")}>あとで</GlassButton></div></div>;
}

function QuizScreen({ questions, activeIndex, selectedAnswer, onAnswer, onNext, onGenerate, onBack }: { questions: QuizQuestion[]; activeIndex: number; selectedAnswer: string | null; onAnswer: (answer: string) => void; onNext: () => void; onGenerate: () => void; onBack: () => void }) {
  const question = questions[activeIndex];
  if (!question) return <div className="space-y-5"><ScreenHeader eyebrow="Quiz" title="小テスト" description="講義ノートから問題を作成します。" onBack={onBack} /><EmptyState text="まだ小テストがありません。自動メモを生成すると問題を作れます。" /><GlassButton onClick={onGenerate} variant="primary">小テストを生成</GlassButton></div>;
  const choices = question.choices ?? [question.answer];
  return <div className="space-y-5"><ScreenHeader eyebrow="Quiz" title="小テスト" description={`${activeIndex + 1} / ${questions.length}`} onBack={onBack} /><GlassCard solid className="p-6"><StatusPill tone={question.difficulty === "hard" ? "rose" : question.difficulty === "normal" ? "amber" : "green"}>{question.difficulty}</StatusPill><h3 className="mt-4 text-xl font-bold leading-8 text-slate-950">{question.question}</h3><div className="mt-5 grid gap-2">{choices.map((choice) => <button key={choice} onClick={() => onAnswer(choice)} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold ${selectedAnswer === choice ? choice === question.answer ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700"}`}>{choice}</button>)}</div>{selectedAnswer ? <div className="mt-5 rounded-2xl bg-sky-50 p-4 text-sm leading-7 text-sky-900"><b>{selectedAnswer === question.answer ? "正解" : "不正解"}</b><br />{question.explanation}</div> : null}</GlassCard><GlassButton onClick={onNext} variant="primary">次の問題</GlassButton></div>;
}

function ExamModeScreen({ cards, questions, weakPoints, queue, courses, onOpenLecture, onBack }: { cards: StudyCard[]; questions: QuizQuestion[]; weakPoints: WeakPoint[]; queue: ReviewQueueItem[]; courses: Course[]; onOpenLecture: (lectureId: string, timestamp?: number) => void; onBack: () => void }) {
  return <div className="space-y-5"><ScreenHeader eyebrow="Exam" title="テスト前モード" description="試験前に見るべき内容を優先度順にまとめます。" onBack={onBack} /><GlassCard className="p-5"><h3 className="text-lg font-bold">科目ごとの優先度</h3><div className="mt-3 space-y-2">{courses.map((course) => <p key={course.id} className="flex justify-between rounded-2xl bg-white/60 px-3 py-3 text-sm font-bold"><span>{course.name}</span><span>{course.examLikelyPointCount + course.confusingMarkerCount} pt</span></p>)}</div></GlassCard><GlassCard solid className="p-4"><h3 className="text-lg font-bold">テスト前に見るべき内容</h3><div className="mt-3 space-y-2">{[...queue.filter((item) => item.type === "exam_likely"), ...weakPoints.map((weak) => ({ id: weak.id, title: weak.title, description: weak.description, lectureId: weak.lectureId, timestamp: weak.timestamp }))].slice(0, 8).map((item) => <button key={item.id} onClick={() => onOpenLecture(item.lectureId, item.timestamp)} className="w-full rounded-2xl bg-slate-50 p-3 text-left text-sm leading-6 text-slate-700"><b>{item.title}</b><br />{item.description}</button>)}</div></GlassCard><div className="grid grid-cols-2 gap-3"><MiniStat label="カード" value={`${cards.length}`} /><MiniStat label="問題" value={`${questions.length}`} /></div></div>;
}

function WeakPointsScreen({ weakPoints, onOpenLecture, onAsk, onBack }: { weakPoints: WeakPoint[]; onOpenLecture: (lectureId: string, timestamp?: number) => void; onAsk: (lectureId: string) => void; onBack: () => void }) {
  return <div className="space-y-5"><ScreenHeader eyebrow="Weak" title="苦手ポイント" description="わからないマーカーや「まだ不安」から優先復習する項目を集めます。" onBack={onBack} />{weakPoints.length === 0 ? <EmptyState text="苦手項目はまだありません。小テストや復習カードを使うと自動で表示されます。" /> : weakPoints.map((weak) => <GlassCard key={weak.id} solid className="p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-950">{weak.title}</h3><StatusPill tone={weak.priority === "high" ? "rose" : "amber"}>{weak.priority}</StatusPill></div><p className="mt-2 text-sm leading-6 text-slate-600">{weak.description}</p><div className="mt-3 grid grid-cols-2 gap-2"><GlassButton onClick={() => onOpenLecture(weak.lectureId, weak.timestamp)}>文字起こしへ</GlassButton><GlassButton onClick={() => onAsk(weak.lectureId)}>AIに質問</GlassButton></div></GlassCard>)}</div>;
}

function ReminderSettingsScreen({ settings, courses, onChange, onBack }: { settings: ReminderSettings; courses: Course[]; onChange: (settings: ReminderSettings) => void; onBack: () => void }) {
  return <div className="space-y-5"><ScreenHeader eyebrow="Reminder" title="リマインダー設定" description="通知時間や科目ごとの復習設定を管理します。" onBack={onBack} /><GlassCard solid className="p-5"><div className="space-y-2"><ReminderToggle label="毎日復習する" checked={settings.dailyReview} onClick={() => onChange({ ...settings, dailyReview: !settings.dailyReview })} /><ReminderToggle label="講義後に復習する" checked={settings.afterLectureReview} onClick={() => onChange({ ...settings, afterLectureReview: !settings.afterLectureReview })} /><ReminderToggle label="テスト前に通知" checked={settings.beforeExam} onClick={() => onChange({ ...settings, beforeExam: !settings.beforeExam })} /><ReminderToggle label="未復習が溜まったら通知" checked={settings.notifyWhenBacklogGrows} onClick={() => onChange({ ...settings, notifyWhenBacklogGrows: !settings.notifyWhenBacklogGrows })} /><label className="block rounded-2xl bg-slate-50 p-3"><span className="text-xs font-bold text-slate-500">通知時間</span><input value={settings.notificationTime} onChange={(event) => onChange({ ...settings, notificationTime: event.target.value })} className="mt-1 w-full bg-transparent text-sm font-bold outline-none" /></label></div></GlassCard><GlassCard className="p-5"><h3 className="text-lg font-bold">科目ごとの復習設定</h3><div className="mt-3 space-y-2">{courses.map((course) => <ReminderToggle key={course.id} label={course.name} checked={settings.courseSettings[course.name] ?? true} onClick={() => onChange({ ...settings, courseSettings: { ...settings.courseSettings, [course.name]: !(settings.courseSettings[course.name] ?? true) } })} />)}</div></GlassCard></div>;
}

function ReminderToggle({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return <button onClick={onClick} role="switch" aria-checked={checked} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-left"><span className="text-sm font-bold text-slate-800">{label}</span><span className={`h-7 w-12 rounded-full p-1 ${checked ? "bg-sky-500" : "bg-slate-300"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : ""}`} /></span></button>;
}

function createChatMessage(role: "user" | "assistant", content: string, references?: ChatMessage["references"]): ChatMessage {
  return { id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, role, content, references, createdAt: new Date().toISOString() };
}

function EmptyState({ text }: { text: string }) {
  return <FeedbackEmptyState title="まだ項目がありません" message={text} />;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="rounded bg-yellow-200 px-0.5">{part}</mark> : part
  );
}

function SettingsScreen({ audioMode, obsidianSettings, llmSettings, jobs, logs, lectures, onAudioModeChange, onObsidianSettingsChange, onLlmSettingsChange, onAddJob, onCancelJob, onRefreshDiagnostics, onBack }: { audioMode: AudioMode; obsidianSettings: ObsidianSettings; llmSettings: LlmSettings; jobs: Job[]; logs: AppLog[]; lectures: Lecture[]; onAudioModeChange: (audioMode: AudioMode) => void; onObsidianSettingsChange: (settings: ObsidianSettings) => void; onLlmSettingsChange: (settings: LlmSettings) => void; onAddJob: (type: Job["type"], message: string) => void; onCancelJob: (jobId: string) => void; onRefreshDiagnostics: () => void; onBack: () => void }) {
  const updateObsidianSettings = (patch: Partial<ObsidianSettings>) => onObsidianSettingsChange({ ...obsidianSettings, ...patch });
  const [mobileSettings, setMobileSettings] = useState<Record<string, boolean>>({
    "録音後に文字起こし": true,
    "充電中のみ高負荷処理": true,
    "スマホ文字起こしは下書き扱い": true,
    "Windows同期後に高精度化": true,
  });

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow="Settings" title="学習環境の設定" description="録音、文字起こし、同期、復習、診断をカテゴリごとに整理しました。" onBack={onBack} />
      <SettingsSection title="録音" description="講義中に安心して使うための録音体験を調整します。">
        <SettingRow title="録音品質" desc="講義向け / mono / 安定優先" active />
        <SettingRow title="バックグラウンド録音" desc="モバイルdev buildで対応予定" />
        <SettingRow title="録音中スリープ防止" desc="講義中に画面が消えにくくする予定" />
        <SettingRow title="マーカーボタン表示" desc="わからない / 重要 / 課題" active />
      </SettingsSection>
      <SettingsSection title="音声保存モード" description="標準は90分で約11MB。講義録音に十分な聞き返し品質です。">
        {audioModeOptions.map((option) => (
          <SettingRow
            key={option.id}
            title={option.title}
            desc={`${option.description} ・ 90分で約${option.estimated90MinMb}MB`}
            active={option.id === audioMode}
            onClick={() => onAudioModeChange(option.id)}
          />
        ))}
        <SettingRow title="文字起こし用一時WAVを削除" desc="処理完了後に削除する" active />
        <SettingRow title="元音声を保持" desc="同期と再処理に備えて保持する" active />
      </SettingsSection>
      <SettingsSection title="文字起こし">
        {[["Windows", "faster-whisper"], ["Mobile", "whisper.cpp"], ["VAD", "on"], ["batch size", "16"], ["GPU", "auto"]].map(([title, desc]) => <SettingRow key={title} title={title} desc={desc} />)}
        <SettingRow title="CPU fallback" desc="GPUが使えない場合にCPUで処理" active />
        <SettingRow title="高精度再文字起こし" desc="Windows同期後にdesktop_finalを生成" active />
      </SettingsSection>
      <SettingsSection title="Mobile processing">
        {Object.entries(mobileSettings).map(([label, checked]) => <SettingToggle key={label} label={label} checked={checked} onChange={() => setMobileSettings((prev) => ({ ...prev, [label]: !prev[label] }))} />)}
      </SettingsSection>
      <SettingsSection title="ライブ要約" description="録音中にリアルタイム要約を表示（近日対応予定）">
        <SettingRow title="ライブ要約ON/OFF" desc="録音中に少し遅れて要約を表示" active />
        <SettingRow title="更新間隔" desc="30秒ごと" active />
        <SettingRow title="対象範囲" desc="直近90秒" active />
        <SettingRow title="表示内容" desc="要約 / やさしい説明 / 重要語句 / 試験 / 課題" active />
      </SettingsSection>
      <SettingsSection title="LLM / AI" description="AI回答の生成に使うバックエンドを選択します。">
        <SettingRow title="回答根拠" desc="文字起こし・要約・マーカーを優先" active />
        <div className="space-y-2">
          {([
            ["mock", "モック（ダミー応答）"],
            ["openai", "OpenAI"],
            ["groq", "Groq（無料枠あり）"],
            ["gemini", "Gemini（無料枠あり）"],
            ["openrouter", "OpenRouter（無料枠あり）"],
            ["ollama", "Ollama（ローカル）"],
            ["local", "Local（互換API）"],
          ] as const).map(([value, label]) => (
            <SettingRow key={value} title={label} desc="" active={llmSettings.provider === value} onClick={() => {
              const defaults = value !== "mock" ? providerDefaults[value as Exclude<LlmProvider, "mock">] : null;
              onLlmSettingsChange({ ...llmSettings, provider: value as LlmProvider, endpoint: defaults?.endpoint ?? llmSettings.endpoint, model: defaults?.model ?? llmSettings.model });
            }} />
          ))}
        </div>
        {llmSettings.provider !== "mock" ? <>
          <SettingInput label="API Key" value={llmSettings.apiKey} onChange={(value) => onLlmSettingsChange({ ...llmSettings, apiKey: value })} placeholder={llmSettings.provider === "ollama" || llmSettings.provider === "local" ? "不要（空欄でOK）" : "sk-..."} />
          <SettingInput label="Endpoint" value={llmSettings.endpoint} onChange={(value) => onLlmSettingsChange({ ...llmSettings, endpoint: value })} placeholder={llmSettings.provider === "ollama" ? "http://localhost:11434/v1" : llmSettings.provider === "gemini" ? "https://generativelanguage.googleapis.com" : "https://api.openai.com/v1"} />
          <SettingInput label="Model" value={llmSettings.model} onChange={(value) => onLlmSettingsChange({ ...llmSettings, model: value })} placeholder={llmSettings.provider === "openai" || llmSettings.provider === "openrouter" ? "gpt-4o-mini" : llmSettings.provider === "groq" ? "llama-3.3-70b-versatile" : llmSettings.provider === "gemini" ? "gemini-2.0-flash" : "llama3"} />
        </> : null}
      </SettingsSection>
      <SettingsSection title="Obsidian設定">
        <SettingInput label="Vault name" value={obsidianSettings.vaultName} onChange={(value) => updateObsidianSettings({ vaultName: value })} placeholder="大学ノート" />
        <SettingInput label="Vault path" value={obsidianSettings.vaultPath} onChange={(value) => updateObsidianSettings({ vaultPath: value })} placeholder="C:\\Users\\user\\Documents\\ObsidianVault" />
        <SettingInput label="Default export folder" value={obsidianSettings.exportFolder} onChange={(value) => updateObsidianSettings({ exportFolder: value })} placeholder="University/Lectures" />
        <SettingInput label="Markdown template" value={obsidianSettings.markdownTemplate} onChange={(value) => updateObsidianSettings({ markdownTemplate: value })} placeholder="lecture-template.md" />
        <SettingToggle label="Export transcript full text" checked={obsidianSettings.exportTranscriptFullText} onChange={() => updateObsidianSettings({ exportTranscriptFullText: !obsidianSettings.exportTranscriptFullText })} />
        <SettingToggle label="Export quiz" checked={obsidianSettings.exportQuiz} onChange={() => updateObsidianSettings({ exportQuiz: !obsidianSettings.exportQuiz })} />
        <SettingToggle label="Export markers" checked={obsidianSettings.exportMarkers} onChange={() => updateObsidianSettings({ exportMarkers: !obsidianSettings.exportMarkers })} />
        <SettingRow title="Obsidian URI生成" desc="Vault名とfile pathから生成" active />
        <SettingRow title="書き出しテスト" desc="Vault path設定後に確認" />
      </SettingsSection>
      <SettingsSection title="同期設定">
        <SettingRow title="Local Wi-Fi" desc="同じネットワーク内のみ" />
        <SettingRow title="Privacy" desc="クラウド送信なし" />
        <SettingRow title="QRペアリング" desc="起動ごとに変わるpairingTokenを使用" active />
        <SettingRow title="自動同期" desc="未実装。手動同期を推奨" />
        <SettingRow title="desktop_finalをスマホへ戻す" desc="Windows高精度版を反映" active />
        <SettingRow title="競合解決ルール" desc="Windows版 / スマホ版 / 手動選択" />
      </SettingsSection>
      <SettingsSection title="復習">
        <SettingRow title="復習カード" desc="自動メモとマーカーから生成" active />
        <SettingRow title="小テスト" desc="重要語句と試験ポイントから生成" active />
        <SettingRow title="リマインダー" desc="実通知は今後対応" />
      </SettingsSection>
      <SettingsSection title="ストレージ">
        <SettingRow title="講義数" desc={`${lectures.length}件`} />
        <SettingRow title="バックアップ保存" desc="重要JSONはbackupを作成" active />
        <SettingRow title="一時ファイル" desc="診断画面から削除予定" />
        <SettingRow title="壊れたデータを検査" desc="診断画面から実行" />
      </SettingsSection>
      <DiagnosticsSection jobs={jobs} logs={logs} lectureCount={lectures.length} vaultPath={obsidianSettings.vaultPath} onAddJob={onAddJob} onCancelJob={onCancelJob} onRefresh={onRefreshDiagnostics} />
      <SettingsSection title="開発者向け診断ログ">
        <GlassButton onClick={() => navigator.clipboard?.writeText(copyableLogs())}>ログをコピー</GlassButton>
        <div className="max-h-52 space-y-2 overflow-auto rounded-2xl bg-slate-50 p-3">
          {logs.length === 0 ? <p className="text-sm text-slate-500">ログはまだありません。</p> : logs.slice(0, 12).map((log) => <p key={log.id} className="text-xs leading-5 text-slate-600">[{log.level}] {log.area}: {log.message}</p>)}
        </div>
      </SettingsSection>
    </div>
  );
}

function DiagnosticsSection({ jobs, logs, lectureCount, vaultPath, onAddJob, onCancelJob, onRefresh }: { jobs: Job[]; logs: AppLog[]; lectureCount: number; vaultPath: string; onAddJob: (type: Job["type"], message: string) => void; onCancelJob: (jobId: string) => void; onRefresh: () => void }) {
  const running = jobs.filter((job) => job.status === "running" || job.status === "queued");
  return (
    <SettingsSection title="開発者向け診断" description="環境と処理状態を、学生にもわかる言葉で確認します。">
      <div className="grid grid-cols-2 gap-2">
        <MetaItem label="Version" value="0.1.0" />
        <MetaItem label="講義数" value={`${lectureCount}`} />
        <MetaItem label="ffmpeg" value="未検出(mock)" />
        <MetaItem label="Python" value="未検出(mock)" />
        <MetaItem label="faster-whisper" value="未検出(mock)" />
        <MetaItem label="GPU" value="auto予定" />
      </div>
      <SettingRow title="Obsidian Vault" desc={vaultPath || "未設定"} />
      <div className="grid grid-cols-2 gap-2">
        <GlassButton onClick={() => { onAddJob("transcribe", "環境チェックを実行中"); onRefresh(); }}>環境チェック</GlassButton>
        <GlassButton onClick={() => onAddJob("compress_audio", "テスト用音声処理")}>テスト音声処理</GlassButton>
        <GlassButton onClick={() => onAddJob("sync", "壊れたデータを検査")}>壊れたデータを検査</GlassButton>
        <GlassButton onClick={onRefresh}>更新</GlassButton>
      </div>
      <div className="space-y-2">
        {running.length === 0 ? <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">実行中の処理はありません。</p> : running.map((job) => <div key={job.id} className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-800">{job.message ?? job.type}</p><button onClick={() => onCancelJob(job.id)} className="text-xs font-bold text-rose-600">キャンセル</button></div><div className="mt-2 h-2 rounded-full bg-white"><div className="h-full rounded-full bg-sky-400" style={{ width: `${job.progress ?? 8}%` }} /></div></div>)}
      </div>
      <p className="text-xs leading-5 text-slate-500">ログ件数: {logs.length} / 保存先: localStorage + data/lectures</p>
    </SettingsSection>
  );
}

function SettingRow({ title, desc, active = false, onClick }: { title: string; desc: string; active?: boolean; onClick?: () => void }) {
  const Element = onClick ? "button" : "div";
  return <Element onClick={onClick} className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-all active:scale-[0.99] ${active ? "bg-sky-50 ring-1 ring-sky-200" : "bg-slate-50 hover:bg-white"}`}><div><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-0.5 text-xs text-slate-500">{desc}</p></div>{active ? <Check className="h-5 w-5 text-sky-600" /> : null}</Element>;
}

function SettingInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block rounded-2xl bg-slate-50 px-3 py-3">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <input className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function SettingToggle({ label, checked = true, onChange }: { label: string; checked?: boolean; onChange?: () => void }) {
  return <button onClick={onChange} role="switch" aria-checked={checked} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-left transition-all active:scale-[0.99]"><span className="text-sm font-bold text-slate-800">{label}</span><span className={`relative h-7 w-12 rounded-full shadow-inner transition-colors ${checked ? "bg-sky-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "right-1" : "left-1"}`} /></span></button>;
}

