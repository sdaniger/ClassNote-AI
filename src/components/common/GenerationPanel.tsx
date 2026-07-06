import { ErrorCard } from "@/components/feedback/ErrorCard";
import { ProgressCard } from "@/components/feedback/ProgressCard";
import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import type { SummaryGenerationStep } from "@/types/lecture";

export function GenerationPanel({ hasNote, hasTranscript, step, error, onGenerate }: { hasNote: boolean; hasTranscript: boolean; step: SummaryGenerationStep; error: string | null; onGenerate: () => void }) {
  const isGenerating = !["idle", "completed", "failed"].includes(step);
  const progressMap: Record<SummaryGenerationStep, number> = {
    idle: hasNote ? 100 : 0,
    chunking_transcript: 18,
    generating_summary: 38,
    extracting_key_points: 55,
    building_timeline: 70,
    generating_quiz: 84,
    generating_markdown: 94,
    completed: 100,
    failed: 0,
  };
  const labelMap: Record<SummaryGenerationStep, string> = {
    idle: hasNote ? "自動メモ生成済み" : "まだ自動メモが生成されていません",
    chunking_transcript: "transcript.jsonをチャンク化中",
    generating_summary: "要約を生成中",
    extracting_key_points: "重要ポイントを抽出中",
    building_timeline: "タイムラインを作成中",
    generating_quiz: "復習問題を作成中",
    generating_markdown: "Markdownを生成中",
    completed: "完了",
    failed: "失敗",
  };

  if (error || step === "failed") {
    return <ErrorCard title="自動メモを生成できませんでした" message={error ?? "文字起こしデータを確認して、もう一度試してください。"} actionLabel="再生成する" onRetry={onGenerate} />;
  }

  if (isGenerating) {
    return <ProgressCard title={labelMap[step]} message="文字起こし、マーカー、講義情報から復習用ノートを生成しています。" progress={progressMap[step]} />;
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Auto Notes</p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{labelMap[step]}</h3>
          {error ? <p className="mt-2 text-sm leading-6 text-rose-600">{error}</p> : <p className="mt-2 text-sm leading-6 text-slate-500">文字起こし、マーカー、講義情報から復習用ノートを生成します。</p>}
        </div>
        <GlassButton onClick={onGenerate} variant={hasNote ? "secondary" : "primary"} disabled={isGenerating || !hasTranscript}>{isGenerating ? "処理中" : hasNote ? "再生成" : "生成"}</GlassButton>
      </div>
    </GlassCard>
  );
}
