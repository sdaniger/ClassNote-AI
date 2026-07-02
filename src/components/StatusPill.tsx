import { CheckCircle2, Clock3, CloudOff, FileAudio2, FolderUp, HardDrive, Loader2, Sparkles, Wifi } from "lucide-react";
import type { AudioAssetStatus, ObsidianExportStatus, SummaryStatus, SyncStatus, TranscriptionStatus } from "@/types/lecture";

type StatusPillProps = {
  children?: React.ReactNode;
  tone?: "blue" | "green" | "amber" | "rose" | "slate" | "violet";
  status?: AudioAssetStatus | TranscriptionStatus | SummaryStatus | ObsidianExportStatus | SyncStatus;
};

const toneClass = {
  blue: "bg-sky-100/80 text-sky-700 ring-sky-200/80",
  green: "bg-emerald-100/80 text-emerald-700 ring-emerald-200/80",
  amber: "bg-amber-100/80 text-amber-800 ring-amber-200/80",
  rose: "bg-rose-100/80 text-rose-700 ring-rose-200/80",
  slate: "bg-slate-100/80 text-slate-700 ring-slate-200/80",
  violet: "bg-violet-100/80 text-violet-700 ring-violet-200/80",
};

const statusMap: Record<string, { label: string; tone: keyof typeof toneClass; icon: React.ElementType }> = {
  not_started: { label: "未処理", tone: "slate", icon: Clock3 },
  preprocessing: { label: "前処理中", tone: "amber", icon: Loader2 },
  transcribing: { label: "文字起こし中", tone: "blue", icon: Loader2 },
  mobile_draft: { label: "スマホ下書き", tone: "violet", icon: Sparkles },
  desktop_refining: { label: "高精度化中", tone: "blue", icon: Loader2 },
  desktop_final: { label: "高精度完了", tone: "green", icon: CheckCircle2 },
  failed: { label: "失敗", tone: "rose", icon: CloudOff },
  imported: { label: "音声取込済み", tone: "blue", icon: FileAudio2 },
  compressed: { label: "Opus保存済み", tone: "green", icon: HardDrive },
  generated: { label: "要約生成済み", tone: "violet", icon: Sparkles },
  not_exported: { label: "未出力", tone: "slate", icon: FolderUp },
  exported: { label: "出力済み", tone: "green", icon: CheckCircle2 },
  local_only: { label: "端末内のみ", tone: "slate", icon: HardDrive },
  update_available: { label: "更新あり", tone: "blue", icon: Sparkles },
  conflict: { label: "競合あり", tone: "amber", icon: Clock3 },
  sync_failed: { label: "同期失敗", tone: "rose", icon: CloudOff },
  not_connected: { label: "未接続", tone: "slate", icon: CloudOff },
  qr_pairing: { label: "QR接続", tone: "blue", icon: Wifi },
  syncing: { label: "同期中", tone: "blue", icon: Loader2 },
  synced: { label: "同期完了", tone: "green", icon: CheckCircle2 },
  windows_pending: { label: "Windows待機中", tone: "amber", icon: Clock3 },
};

export function StatusPill({ children, tone = "slate", status }: StatusPillProps) {
  const mapped = status ? statusMap[status] : undefined;
  const Icon = mapped?.icon;
  const color = mapped?.tone ?? tone;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${toneClass[color]}`}>
      {Icon ? <Icon className={`h-3.5 w-3.5 ${mapped?.icon === Loader2 ? "animate-spin" : ""}`} /> : null}
      {mapped?.label ?? children}
    </span>
  );
}
