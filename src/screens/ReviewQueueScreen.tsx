import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { formatTimestamp } from "@/lib/formatTime";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import type { ReviewQueueItem } from "@/types/lecture";

export function ReviewQueueScreen({ items, onOpenItem, onBack }: { items: ReviewQueueItem[]; onOpenItem: (item: ReviewQueueItem) => void; onBack: () => void }) {
  return <div className="space-y-5"><ScreenHeader eyebrow="Review" title="今日の復習" description="わからないまま残っている箇所と、試験前に見返すべき講義を集めました。" onBack={onBack} />{items.length === 0 ? <FeedbackEmptyState title="まだ項目がありません" message="まだ復習が必要な講義はありません。今日の講義を録音すると自動で表示されます。" /> : items.map((item) => <button key={item.id} onClick={() => onOpenItem(item)} className="w-full text-left"><GlassCard solid className="p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-950">{item.title}</h3><StatusPill tone={item.priority === "high" ? "rose" : item.priority === "medium" ? "amber" : "slate"}>{item.priority}</StatusPill></div><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>{item.timestamp !== undefined ? <p className="mt-2 text-xs font-bold text-sky-700">{formatTimestamp(item.timestamp)} から復習する</p> : null}</GlassCard></button>)}</div>;
}
