import { GlassCard } from "@/components/GlassCard";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { formatTimestamp } from "@/lib/formatTime";
import type { LectureNote, LectureMarker } from "@/types/lecture";

export function TimelineTab({ note, markers }: { note?: LectureNote; markers: LectureMarker[] }) {
  const timeline = note?.timeline ?? [];

  if (timeline.length === 0 && markers.length === 0) {
    return (
      <div className="space-y-3">
        <FeedbackEmptyState title="タイムラインはまだありません" message="自動メモを生成すると、講義の区切りや重要ポイントがタイムラインに表示されます。" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timeline.map((item) => (
        <GlassCard key={item.start} solid className="p-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="rounded-full bg-sky-500 px-2.5 py-1 text-xs font-bold text-white tabular-nums">{formatTimestamp(item.start)}</span>
              <span className="mt-2 h-full w-px bg-slate-200" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          </div>
        </GlassCard>
      ))}
      {markers.map((marker) => (
        <GlassCard key={`${marker.type}-${marker.time}`} solid className="p-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white tabular-nums">{formatTimestamp(marker.time)}</span>
              <span className="mt-2 h-full w-px bg-slate-200" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">{marker.label}</h3>
              <p className="mt-1 text-xs font-bold text-slate-400">{marker.type}</p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
