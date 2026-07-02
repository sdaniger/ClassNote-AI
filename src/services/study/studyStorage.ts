import type { QuizQuestion, ReminderSettings, StudyCard, StudySession } from "@/types/lecture";

const CARDS_KEY = "classnote-ai:study-cards:v1";
const QUIZ_KEY = "classnote-ai:quiz-questions:v1";
const SESSIONS_KEY = "classnote-ai:study-sessions:v1";
const REMINDER_KEY = "classnote-ai:reminder-settings:v1";

export const defaultReminderSettings: ReminderSettings = { dailyReview: true, afterLectureReview: true, beforeExam: true, notifyWhenBacklogGrows: true, notificationTime: "20:00", courseSettings: {} };

export function loadStudyCards(): StudyCard[] { return load<StudyCard[]>(CARDS_KEY, []); }
export function saveStudyCards(cards: StudyCard[]) { save(CARDS_KEY, cards); }
export function loadQuizQuestions(): QuizQuestion[] { return load<QuizQuestion[]>(QUIZ_KEY, []); }
export function saveQuizQuestions(questions: QuizQuestion[]) { save(QUIZ_KEY, questions); }
export function loadStudySessions(): StudySession[] { return load<StudySession[]>(SESSIONS_KEY, []); }
export function saveStudySessions(sessions: StudySession[]) { save(SESSIONS_KEY, sessions); }
export function loadReminderSettings(): ReminderSettings { return { ...defaultReminderSettings, ...load<Partial<ReminderSettings>>(REMINDER_KEY, {}) }; }
export function saveReminderSettings(settings: ReminderSettings) { save(REMINDER_KEY, settings); }

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(window.localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}

function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
