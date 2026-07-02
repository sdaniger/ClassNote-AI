import type { Job } from "./jobTypes";

const JOBS_KEY = "classnote-ai:jobs:v1";

export function loadJobs(): Job[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(JOBS_KEY) ?? "[]") as Job[]; } catch { return []; }
}

export function saveJobs(jobs: Job[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOBS_KEY, JSON.stringify(jobs.slice(0, 80)));
}
