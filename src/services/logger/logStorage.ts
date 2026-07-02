export type AppLog = {
  id: string;
  level: "info" | "warning" | "error";
  area: "recording" | "audio" | "transcription" | "summary" | "obsidian" | "sync" | "storage" | "ui";
  message: string;
  details?: string;
  createdAt: string;
};

const LOGS_KEY = "classnote-ai:logs:v1";

export function loadLogs(): AppLog[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(LOGS_KEY) ?? "[]") as AppLog[]; } catch { return []; }
}

export function saveLogs(logs: AppLog[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 200)));
}
