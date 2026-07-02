import { AlertCircle, CheckCircle2, ClipboardList } from "lucide-react";
import type { TranscriptSegment } from "@/types/lecture";
import { formatTimestamp } from "@/lib/formatTime";

const markerMeta = {
  confused: { label: "わからない", className: "bg-rose-100 text-rose-700", icon: AlertCircle },
  important: { label: "重要", className: "bg-amber-100 text-amber-800", icon: CheckCircle2 },
  task: { label: "課題", className: "bg-sky-100 text-sky-700", icon: ClipboardList },
};

export function TimestampRow({ segment }: { segment: TranscriptSegment }) {
  const meta = segment.marker ? markerMeta[segment.marker] : undefined;
  const Icon = meta?.icon;

  return (
    <button className={`w-full rounded-[22px] p-4 text-left transition-all active:scale-[0.99] ${segment.active ? "bg-sky-50 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.20)]" : "bg-white hover:bg-slate-50"}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 w-12 shrink-0 rounded-full px-2 py-1 text-center text-[11px] font-bold tabular-nums ${segment.active ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500"}`}>{formatTimestamp(segment.start)}</span>
        <div className="flex-1">
          <p className="text-[15px] leading-7 text-slate-800">{segment.text}</p>
          {meta ? (
            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              {meta.label}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
