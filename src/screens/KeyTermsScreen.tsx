import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import type { KeyTerm } from "@/types/lecture";

export function KeyTermsScreen({ terms, onOpenTerm, onBack }: { terms: KeyTerm[]; onOpenTerm: (term: KeyTerm) => void; onBack: () => void }) {
  return <div className="space-y-5"><ScreenHeader eyebrow="Terms" title="重要語句" description="講義全体から抽出された用語を、科目・講義・タイムスタンプと一緒に確認します。" onBack={onBack} />{terms.length === 0 ? <FeedbackEmptyState title="まだ項目がありません" message="重要語句がまだ生成されていません。自動メモを生成するとここに表示されます。" /> : terms.map((term) => <button key={term.id} onClick={() => onOpenTerm(term)} className="w-full text-left"><GlassCard solid className="p-5"><div className="flex items-center justify-between"><h3 className="text-xl font-bold text-slate-950">{term.term}</h3><StatusPill tone="violet">Obsidian link</StatusPill></div><p className="mt-1 text-sm font-semibold text-slate-500">{term.course}</p><p className="mt-3 text-sm leading-6 text-slate-700">{term.description}</p><p className="mt-3 text-xs font-bold text-sky-700">出現: {term.lectureTitles.join(", ")}</p></GlassCard></button>)}</div>;
}
