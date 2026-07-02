import type { ChatMessage } from "@/types/lecture";

const LECTURE_CHAT_KEY = "classnote-ai:lecture-chat:v1";
const GLOBAL_CHAT_KEY = "classnote-ai:global-chat:v1";

export function loadLectureChatHistory(): Record<string, ChatMessage[]> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(LECTURE_CHAT_KEY) ?? "{}"); } catch { return {}; }
}

export function saveLectureChatHistory(lectureId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  const all = loadLectureChatHistory();
  all[lectureId] = messages;
  window.localStorage.setItem(LECTURE_CHAT_KEY, JSON.stringify(all));
}

export function loadGlobalChatHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(GLOBAL_CHAT_KEY) ?? "[]"); } catch { return []; }
}

export function saveGlobalChatHistory(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GLOBAL_CHAT_KEY, JSON.stringify(messages));
}
