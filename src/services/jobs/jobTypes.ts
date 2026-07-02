export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type Job = {
  id: string;
  type: "compress_audio" | "transcribe" | "generate_note" | "export_obsidian" | "sync" | "desktop_refine" | "live_insight";
  lectureId?: string;
  status: JobStatus;
  progress?: number;
  message?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};
