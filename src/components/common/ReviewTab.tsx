import { AlertCircle, ListChecks, Star } from "lucide-react";
import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { SummaryPanel } from "@/components/SummaryPanel";
import { CheckLine } from "./CheckLine";
import { formatTimestamp } from "@/lib/formatTime";
import type { LectureNote, SummaryGenerationStep } from "@/types/lecture";

export function ReviewTab({ note, generationStep, generationError, onGenerateNote }: { note?: LectureNote; generationStep: SummaryGenerationStep; generationError: string | null; onGenerateNote: () => void }) {
  if (!note) {
    return (
      <div className="space-y-4">
        <GlassCard className="p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br from-violet-100 to-sky-100 text-violet-700 shadow-inner">
            <Star className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-950">まだ自動メモが生成されていません</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">transcript.jsonから要約、重要ポイント、復習問題、わからなかった場所の解説を生成できます。</p>
          {generationError ? <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{generationError}</p> : null}
          <GlassButton onClick={onGenerateNote} variant="primary" className="mt-5 w-full" disabled={!(["idle", "completed", "failed"].includes(generationStep))}>{generationStep === "idle" || generationStep === "failed" || generationStep === "completed" ? "自動メモを生成する" : "生成中"}</GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryPanel title="要約">{note.summary}</SummaryPanel>
      <GlassCard solid className="p-5"><h3 className="text-lg font-bold">重要ポイント</h3><div className="mt-3 space-y-2">{note.keyPoints.map((point) => <CheckLine key={point}>{point}</CheckLine>)}</div></GlassCard>
      <GlassCard solid className="p-5"><h3 className="text-lg font-bold">試験に出そうな部分</h3><div className="mt-3 space-y-2">{note.examLikelyPoints.map((point) => <CheckLine key={point}>{point}</CheckLine>)}</div></GlassCard>
      <GlassCard solid className="p-5"><h3 className="text-lg font-bold">復習問題</h3><div className="mt-3 space-y-2">{note.quiz.map((item, i) => <p key={item.question} className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><span className="font-bold text-slate-950">Q{i + 1}. {item.question}</span><br />{item.answer}</p>)}</div></GlassCard>
      <GlassCard className="p-5"><h3 className="flex items-center gap-2 text-lg font-bold"><AlertCircle className="h-5 w-5 text-rose-500" />わからなかった場所</h3><div className="mt-2 space-y-2">{note.confusingParts.map((part) => <p key={part.markerTime} className="rounded-2xl bg-white/58 p-3 text-sm leading-7 text-slate-600"><span className="font-bold text-slate-900">{formatTimestamp(part.markerTime)} {part.title}</span><br />{part.explanation}</p>)}</div></GlassCard>
      <GlassCard solid className="p-5"><h3 className="flex items-center gap-2 text-lg font-bold"><ListChecks className="h-5 w-5 text-emerald-500" />今日復習すること</h3><div className="mt-3 space-y-2">{note.reviewChecklist.map((item) => <CheckLine key={item}>{item}</CheckLine>)}</div></GlassCard>
    </div>
  );
}
