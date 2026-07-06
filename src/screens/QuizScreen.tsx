import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import type { QuizQuestion } from "@/types/lecture";

export function QuizScreen({ questions, activeIndex, selectedAnswer, onAnswer, onNext, onGenerate, onBack }: { questions: QuizQuestion[]; activeIndex: number; selectedAnswer: string | null; onAnswer: (answer: string) => void; onNext: () => void; onGenerate: () => void; onBack: () => void }) {
  const question = questions[activeIndex];
  if (!question) return <div className="space-y-5"><ScreenHeader eyebrow="Quiz" title="小テスト" description="講義ノートから問題を作成します。" onBack={onBack} /><FeedbackEmptyState title="まだ項目がありません" message="まだ小テストがありません。自動メモを生成すると問題を作れます。" /><GlassButton onClick={onGenerate} variant="primary">小テストを生成</GlassButton></div>;
  const choices = question.choices ?? [question.answer];
  return <div className="space-y-5"><ScreenHeader eyebrow="Quiz" title="小テスト" description={`${activeIndex + 1} / ${questions.length}`} onBack={onBack} /><GlassCard solid className="p-6"><StatusPill tone={question.difficulty === "hard" ? "rose" : question.difficulty === "normal" ? "amber" : "green"}>{question.difficulty}</StatusPill><h3 className="mt-4 text-xl font-bold leading-8 text-slate-950">{question.question}</h3><div className="mt-5 grid gap-2">{choices.map((choice) => <button key={choice} onClick={() => onAnswer(choice)} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold ${selectedAnswer === choice ? choice === question.answer ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700"}`}>{choice}</button>)}</div>{selectedAnswer ? <div className="mt-5 rounded-2xl bg-sky-50 p-4 text-sm leading-7 text-sky-900"><b>{selectedAnswer === question.answer ? "正解" : "不正解"}</b><br />{question.explanation}</div> : null}</GlassCard><GlassButton onClick={onNext} variant="primary">次の問題</GlassButton></div>;
}
