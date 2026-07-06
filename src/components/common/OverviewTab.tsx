import { ExternalLink } from "lucide-react";
import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { SummaryPanel } from "@/components/SummaryPanel";
import { StatusBox } from "./StatusBox";
import { CheckLine } from "./CheckLine";
import { SparkleIcon } from "./SparkleIcon";
import { GenerationPanel } from "./GenerationPanel";
import type { Lecture, LectureNote, SummaryGenerationStep } from "@/types/lecture";

export function OverviewTab({ lecture, note, hasTranscript, generationStep, generationError, onGenerateNote, onOpenObsidian }: { lecture: Lecture; note?: LectureNote; hasTranscript: boolean; generationStep: SummaryGenerationStep; generationError: string | null; onGenerateNote: () => void; onOpenObsidian: () => void }) {
  const confusingParts = note?.confusingParts ?? [];
  const keyPoints = note?.keyPoints ?? [];

  return (
    <div className="space-y-4">
      <SummaryPanel title="要約">
        {note ? note.summary : hasTranscript ? "文字起こしが完了しました。自動メモを生成すると要約が表示されます。" : "音声ファイルは講義として登録済みです。文字起こしを完了すると、要約・復習ノートを自動生成できます。"}
      </SummaryPanel>
      <GenerationPanel hasNote={Boolean(note)} hasTranscript={hasTranscript} step={generationStep} error={generationError} onGenerate={onGenerateNote} />
      <GlassCard solid className="p-5">
        <h3 className="text-lg font-bold text-slate-900">処理ステータス</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <StatusBox label="音声" status={lecture.audioStatus} />
          <StatusBox label="文字起こし" status={lecture.transcriptionStatus} />
          <StatusBox label="要約" status={lecture.summaryStatus} />
          <StatusBox label="Obsidian" status={lecture.obsidianExportStatus} />
        </div>
      </GlassCard>
      {keyPoints.length > 0 ? <GlassCard solid className="p-5"><h3 className="text-lg font-bold text-slate-900">重要ポイント</h3><div className="mt-3 space-y-2">{keyPoints.map((point) => <CheckLine key={point}>{point}</CheckLine>)}</div></GlassCard> : null}
      {confusingParts.length > 0 ? <GlassCard className="p-5"><h3 className="text-lg font-bold text-slate-900">わからなかった場所</h3><p className="mt-2 text-sm leading-7 text-slate-600">{confusingParts[0]?.title} - {confusingParts[0]?.explanation}</p></GlassCard> : null}
      <div className="grid gap-3">
        <GlassButton onClick={onGenerateNote} disabled={!hasTranscript}><SparkleIcon />{note ? "再生成" : "自動メモを生成"}</GlassButton>
        <GlassButton onClick={onOpenObsidian}><ExternalLink className="h-4 w-4" />Obsidianへ出力</GlassButton>
      </div>
    </div>
  );
}
