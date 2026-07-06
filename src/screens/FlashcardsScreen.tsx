import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { formatTimestamp } from "@/lib/formatTime";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import type { StudyCard } from "@/types/lecture";

export function FlashcardsScreen({ cards, activeIndex, showBack, onFlip, onStatus, onGenerate, onOpenLecture, onBack }: { cards: StudyCard[]; activeIndex: number; showBack: boolean; onFlip: () => void; onStatus: (cardId: string, status: StudyCard["status"]) => void; onGenerate: () => void; onOpenLecture: (lectureId: string, timestamp?: number) => void; onBack: () => void }) {
  const card = cards[activeIndex];
  if (!card) return <div className="space-y-5"><ScreenHeader eyebrow="Cards" title="復習カード" description="講義ノートからカードを作成します。" onBack={onBack} /><FeedbackEmptyState title="まだ項目がありません" message="まだ復習カードはありません。講義を文字起こしして、自動メモを生成すると復習カードを作れます。" /><GlassButton onClick={onGenerate} variant="primary">復習カードを生成</GlassButton></div>;
  return <div className="space-y-5"><ScreenHeader eyebrow="Cards" title="復習カード" description={`${activeIndex + 1} / ${cards.length}`} onBack={onBack} /><button onClick={onFlip} className="w-full text-left"><GlassCard solid className="min-h-80 p-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">{showBack ? "Answer" : "Question"}</p><h3 className="mt-4 text-2xl font-bold leading-9 text-slate-950">{showBack ? card.back : card.front}</h3>{showBack && card.explanation ? <p className="mt-4 text-sm leading-7 text-slate-600">{card.explanation}</p> : null}{card.timestamp !== undefined ? <button onClick={(event) => { event.stopPropagation(); onOpenLecture(card.lectureId, card.timestamp); }} className="mt-5 rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">関連: {formatTimestamp(card.timestamp)}</button> : null}</GlassCard></button><div className="grid grid-cols-3 gap-2"><GlassButton onClick={() => onStatus(card.id, "known")}>わかった</GlassButton><GlassButton onClick={() => onStatus(card.id, "weak")}>まだ不安</GlassButton><GlassButton onClick={() => onStatus(card.id, "later")}>あとで</GlassButton></div></div>;
}
