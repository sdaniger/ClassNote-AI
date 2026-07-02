import { addLog } from "@/services/logger/logger";
import { loadJobs, saveJobs } from "./jobStorage";
import type { Job } from "./jobTypes";

export function enqueueJob(input: Pick<Job, "type" | "lectureId" | "message">): Job {
  const now = new Date().toISOString();
  const job: Job = { id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, status: "queued", progress: 0, createdAt: now, updatedAt: now, ...input };
  const jobs = [job, ...loadJobs()];
  saveJobs(jobs);
  addLog({ level: "info", area: "ui", message: `ジョブを追加しました: ${job.type}`, details: job.lectureId });
  return job;
}

export function updateJob(jobId: string, patch: Partial<Job>) {
  const jobs = loadJobs().map((job) => job.id === jobId ? { ...job, ...patch, updatedAt: new Date().toISOString() } : job);
  saveJobs(jobs);
  return jobs.find((job) => job.id === jobId);
}

export function cancelJob(jobId: string) {
  return updateJob(jobId, { status: "cancelled", message: "キャンセルしました" });
}
