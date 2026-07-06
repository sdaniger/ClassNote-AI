"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { buildLectureMarkdown } from "@/lib/markdown/buildLectureMarkdown";
import { defaultObsidianSettings, loadLectureMarkdown, loadLectureNotes, loadObsidianSettings, saveLectureMarkdown, saveLectureNote, saveObsidianSettings } from "@/lib/obsidian/obsidianStore";
import { generateLectureSummary } from "@/lib/summary/generateLectureNote";
import { createLecture, defaultAudioMode, deleteLecture, loadAudioMode, loadLectures, loadMarkersByLecture, loadTranscriptByLecture, saveAudioMode, saveLectures, saveMarkersByLecture, saveTranscriptByLecture, updateLecture } from "@/lib/lectureStore";
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
import { addLog } from "@/services/logger/logger";
import { loadLogs, type AppLog } from "@/services/logger/logStorage";
import { ToastProvider, useToast } from "@/hooks/useToast";
import { useDarkMode } from "@/hooks/useDarkMode";
import { ToastContainer } from "@/components/feedback/Toast";
import { buildCourses, buildKeyTerms, buildReviewQueue, buildTags } from "@/services/search/studyCollections";
import { loadLlmSettings, saveLlmSettings, defaultLlmSettings } from "@/lib/llm/llmSettings";
import type { LlmSettings } from "@/lib/llm/llmSettings";
import { saveAudio, deleteAudio } from "@/services/recording/recordingStorage";
import type { RecordingResult } from "@/services/recording/recordingService";
import { formatDurationMs } from "@/lib/formatTime";
import type { AppScreen, AudioMode, ChatMessage, Course, CreateLectureInput, DetailTab, KeyTerm, Lecture, LectureMarker, LectureNote, LectureTag, MarkerType, ObsidianSettings, QuizQuestion, ReminderSettings, ReviewQueueItem, SearchResult, StudyCard, StudySession, SummaryGenerationStep, TranscriptSegment, WeakPoint } from "@/types/lecture";

import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";
import { NoLectureSelected } from "@/components/common/NoLectureSelected";
import { HomeScreen } from "@/screens/HomeScreen";
import { RecordingScreen } from "@/screens/RecordingScreen";
import { LectureDetailScreen } from "@/screens/LectureDetailScreen";
import { SyncScreen } from "@/screens/SyncScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { CoursesScreen } from "@/screens/CoursesScreen";
import { CourseDetailScreen } from "@/screens/CourseDetailScreen";
import { ReviewQueueScreen } from "@/screens/ReviewQueueScreen";
import { TagsScreen } from "@/screens/TagsScreen";
import { KeyTermsScreen } from "@/screens/KeyTermsScreen";
import { LectureChatScreen } from "@/screens/LectureChatScreen";
import { GlobalChatScreen } from "@/screens/GlobalChatScreen";
import { StudyHomeScreen } from "@/screens/StudyHomeScreen";
import { FlashcardsScreen } from "@/screens/FlashcardsScreen";
import { QuizScreen } from "@/screens/QuizScreen";
import { ExamModeScreen } from "@/screens/ExamModeScreen";
import { WeakPointsScreen } from "@/screens/WeakPointsScreen";
import { ReminderSettingsScreen } from "@/screens/ReminderSettingsScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";

function createChatMessage(role: "user" | "assistant", content: string, references?: ChatMessage["references"]): ChatMessage {
  return { id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, role, content, references, createdAt: new Date().toISOString() };
}

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
  const { addToast } = useToast();
  const darkMode = useDarkMode();
  const recordingActionsRef = useRef<{ toggleRecording: () => void; addConfusedMarker: () => void } | null>(null);
  const audioToggleRef = useRef<(() => void) | null>(null);

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

  useEffect(() => { if (isLoaded) saveLectures(lectures); }, [isLoaded, lectures]);
  useEffect(() => { if (isLoaded) saveAudioMode(audioMode); }, [audioMode, isLoaded]);
  useEffect(() => { if (isLoaded) saveObsidianSettings(obsidianSettings); }, [isLoaded, obsidianSettings]);
  useEffect(() => { if (isLoaded) saveMarkersByLecture(markersByLecture); }, [isLoaded, markersByLecture]);
  useEffect(() => { if (isLoaded) saveTranscriptByLecture(transcriptByLecture); }, [isLoaded, transcriptByLecture]);

  const selectedLecture = useMemo(
    () => lectures.find((lecture) => lecture.id === selectedLectureId) ?? lectures[0] ?? null,
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
    addToast({ type: "success", title: "講義を作成しました", message: lecture.title });
  };

  const handleDeleteLecture = (lectureId: string) => {
    const lecture = lectures.find((l) => l.id === lectureId);
    if (!lecture) return;
    if (!window.confirm(`「${lecture.title}」を削除しますか？この操作は取り消せません。`)) return;
    if (lecture.audioKey) deleteAudio(lecture.audioKey).catch((err) => addLog({ level: "error", area: "storage", message: `音声ファイル削除失敗: ${err}` }));
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
    addLog({ level: "info", area: "ui", message: `講義を削除: ${lecture.title}` });
    setLogs(loadLogs());
    addToast({ type: "success", title: "講義を削除しました", message: lecture.title });
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
      addToast({ type: "success", title: "文字起こしが完了しました" });
    } catch (error) {
      setLectures((current) => updateLecture(current, lectureId, { transcriptionStatus: "failed" }));
      addLog({ level: "error", area: "transcription", message: error instanceof Error ? error.message : "文字起こし処理に失敗しました。" });
      setLogs(loadLogs());
      addToast({ type: "error", title: "文字起こしに失敗しました" });
    } finally {
      setTranscribingLectureId(null);
      setTranscriptionProgress(0);
    }
  }, []);

  useEffect(() => {
    if (!transcribingLectureId) return;
    setTranscriptionProgress(0);
    const timeout = setTimeout(() => setTranscriptionProgress(50), 3000);
    return () => clearTimeout(timeout);
  }, [transcribingLectureId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setScreen("home");
        return;
      }

      if (screen === "recording") {
        if (e.key === "r") {
          e.preventDefault();
          recordingActionsRef.current?.toggleRecording();
        }
        if (e.key === "m") {
          e.preventDefault();
          recordingActionsRef.current?.addConfusedMarker();
        }
      }

      if (screen === "detail") {
        if (e.key === " ") {
          e.preventDefault();
          audioToggleRef.current?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen]);

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
      }).catch((err) => addLog({ level: "warning", area: "sync", message: `サーバー保存失敗: ${err instanceof Error ? err.message : err}` }));
      setGenerationStep("completed");
      addToast({ type: "success", title: "自動メモを生成しました", message: lecture.title });
    } catch (error) {
      setGenerationStep("failed");
      setGenerationError(error instanceof Error ? error.message : "自動メモ生成に失敗しました。");
      addToast({ type: "error", title: "生成に失敗しました" });
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
    enqueueJob({ type, message });
    setJobs(loadJobs());
    addLog({ level: "info", area: "ui", message: `診断ジョブを追加: ${type}` });
    setLogs(loadLogs());
  };

  const cancelDiagnosticJob = (jobId: string) => {
    cancelJob(jobId);
    setJobs(loadJobs());
  };

  return (
    <ToastProvider>
    <AppShell>
      <ToastContainer />
      <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24 pt-9">
          {!isLoaded ? <LoadingSkeleton /> : null}
          {screen === "home" ? <HomeScreen lectures={lectures} audioMode={audioMode} onRecord={() => setScreen("recording")} onOpenDetail={(lectureId) => openDetail(lectureId, "overview")} onCreateLecture={handleCreateLecture} onNavigate={setScreen} /> : null}
          {screen === "recording" ? <RecordingScreen lecture={selectedLecture} audioMode={audioMode} onImport={() => setScreen("home")} onRecordingComplete={handleCreateLectureFromRecording} onBack={() => setScreen("home")} recordingActionsRef={recordingActionsRef} /> : null}
          {screen === "detail" ? selectedLecture ? <LectureDetailScreen lecture={selectedLecture} note={notes[selectedLecture.id]} markdown={markdownByLecture[selectedLecture.id]} obsidianSettings={obsidianSettings} transcript={transcriptByLecture[selectedLecture.id] ?? []} markers={markersByLecture[selectedLecture.id] ?? []} generationStep={generationStep} generationError={generationError} jumpTimestamp={jumpTimestamp} onCourseOpen={(course) => { setSelectedCourse(course); setScreen("courseDetail"); }} onOpenChat={() => setScreen("lectureChat")} onGenerateNote={handleGenerateNote} onTabChange={setDetailTab} activeTab={detailTab} onDeleteLecture={handleDeleteLecture} onUpdateLecture={handleUpdateLecture} onBack={() => setScreen("home")} transcriptionProgress={transcribingLectureId === selectedLecture.id ? transcriptionProgress : null} audioToggleRef={audioToggleRef} /> : <NoLectureSelected onRecord={() => setScreen("recording")} /> : null}
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
          {screen === "settings" ? <SettingsScreen audioMode={audioMode} obsidianSettings={obsidianSettings} llmSettings={llmSettings} jobs={jobs} logs={logs} lectures={lectures} onAudioModeChange={setAudioMode} onObsidianSettingsChange={setObsidianSettings} onLlmSettingsChange={(settings: LlmSettings) => { saveLlmSettings(settings); setLlmSettings(settings); }} onAddJob={addDiagnosticJob} onCancelJob={cancelDiagnosticJob} onRefreshDiagnostics={() => { setJobs(loadJobs()); setLogs(loadLogs()); }} onBack={() => setScreen("home")} darkMode={darkMode.dark} onDarkModeChange={darkMode.toggle} /> : null}
        </div>
        <FloatingTabBar active={screen} onChange={setScreen} />
      </div>
    </AppShell>
    </ToastProvider>
  );
}
