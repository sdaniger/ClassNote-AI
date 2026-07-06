import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import type { WeakPoint } from "@/types/lecture";

export function WeakPointsScreen({ weakPoints, onOpenLecture, onAsk, onBack }: { weakPoints: WeakPoint[]; onOpenLecture: (lectureId: string, timestamp?: number) => void; onAsk: (lectureId: string) => void; onBack: () => void }) {
  return <div className="space-y-5"><ScreenHeader eyebrow="Weak" title="苦手ポイント" description="わからないマーカーや「まだ不安」から優先復習する項目を集めます。" onBack={onBack} />{weakPoints.length === 0 ? <FeedbackEmptyState title="まだ項目がありません" message="苦手項目はまだありません。小テストや復習カードを使うと自動で表示されます。" /> : weakPoints.map((weak) => <GlassCard key={weak.id} solid className="p-4"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-950">{weak.title}</h3><StatusPill tone={weak.priority === "high" ? "rose" : "amber"}>{weak.priority}</StatusPill></div><p className="mt-2 text-sm leading-6 text-slate-600">{weak.description}</p><div className="mt-3 grid grid-cols-2 gap-2"><GlassButton onClick={() => onOpenLecture(weak.lectureId, weak.timestamp)}>文字起こしへ</GlassButton><GlassButton onClick={() => onAsk(weak.lectureId)}>AIに質問</GlassButton></div></GlassCard>)}</div>;
}
