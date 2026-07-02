import { loadLogs, saveLogs, type AppLog } from "./logStorage";

export function addLog(input: Omit<AppLog, "id" | "createdAt">) {
  const log: AppLog = { id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), ...input };
  saveLogs([log, ...loadLogs()]);
  return log;
}

export function copyableLogs() {
  return loadLogs().map((log) => `[${log.createdAt}] ${log.level}/${log.area}: ${log.message}${log.details ? ` ${log.details}` : ""}`).join("\n");
}
