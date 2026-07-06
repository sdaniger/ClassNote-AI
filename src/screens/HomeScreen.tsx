"use client";
import { Cloud, FileAudio2, Laptop, Mic } from "lucide-react";
import { AudioImportPanel } from "@/components/AudioImportPanel";
import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { LectureCard } from "@/components/LectureCard";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { formatJapaneseDate } from "@/lib/formatTime";
import { getAudioModeShortLabel } from "@/lib/lectureStore";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { MiniStat } from "@/components/common/MiniStat";
import { QuickNav } from "@/components/common/QuickNav";
import type { AppScreen, AudioMode, CreateLectureInput, Lecture } from "@/types/lecture";

export function HomeScreen({
  lectures,
  audioMode,
  onRecord,
  onOpenDetail,
  onCreateLecture,
  onNavigate,
}: {
  lectures: Lecture[];
  audioMode: AudioMode;
  onRecord: () => void;
  onOpenDetail: (lectureId: string) => void;
  onCreateLecture: (input: CreateLectureInput) => void;
  onNavigate: (screen: AppScreen) => void;
}) {
  if (lectures.length === 0) {
    return (
      <div className="space-y-5">
        <ScreenHeader eyebrow="Welcome" title="講義を1本追加しましょう" description="サンプルは表示しません。録音するか、手元の音声ファイルを取り込むだけで始められます。" />
        <FeedbackEmptyState title="まだ講義がありません" message="最初の講義を追加すると、文字起こし、復習ノート、Obsidian出力、LAN同期を使えるようになります。" />
        <div className="grid grid-cols-2 gap-3">
          <GlassButton onClick={onRecord} variant="primary"><Mic className="h-4 w-4" />録音する</GlassButton>
          <GlassButton onClick={() => {
            const panel = document.getElementById("audio-import-panel");
            panel?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}><FileAudio2 className="h-4 w-4" />下から取り込む</GlassButton>
        </div>
        <AudioImportPanel audioMode={audioMode} onCreateLecture={onCreateLecture} panelId="audio-import-panel" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow={formatJapaneseDate(new Date().toISOString())} title="講義を記録する" description="録音、文字起こし、復習ノートまで自動で整理します。" />

      <GlassCard className="relative overflow-hidden p-5">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <button onClick={onRecord} className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-400 via-red-500 to-orange-400 text-white shadow-[0_22px_60px_rgba(244,63,94,0.38)] ring-8 ring-white/45 transition-all active:scale-95" aria-label="録音開始">
            <Mic className="h-9 w-9" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Ready</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">新しい講義を録音</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">スマホでもWindowsでも開始できます。</p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
          <MiniStat label="音声" value={getAudioModeShortLabel(audioMode)} />
          <MiniStat label="文字起こし" value="ローカル" />
          <MiniStat label="同期" value="Windows待機中" />
        </div>
      </GlassCard>

      <AudioImportPanel audioMode={audioMode} onCreateLecture={onCreateLecture} />

      <div className="grid grid-cols-3 gap-2">
        <QuickNav label="検索" onClick={() => onNavigate("search")} />
        <QuickNav label="AI相談" onClick={() => onNavigate("globalChat")} />
        <QuickNav label="学習" onClick={() => onNavigate("studyHome")} />
        <QuickNav label="科目" onClick={() => onNavigate("courses")} />
        <QuickNav label="復習" onClick={() => onNavigate("reviewQueue")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <Cloud className="h-5 w-5 text-violet-600" />
          <p className="mt-3 text-sm font-bold text-slate-900">Obsidian</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Vault: University Notes</p>
          <StatusPill tone="green">接続済み</StatusPill>
        </GlassCard>
        <GlassCard className="p-4">
          <Laptop className="h-5 w-5 text-sky-600" />
          <p className="mt-3 text-sm font-bold text-slate-900">Windows Sync</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">高精度化を待機中</p>
          <StatusPill status="windows_pending" />
        </GlassCard>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-950">最近の講義</h2>
          <button onClick={() => onNavigate("courses")} className="text-xs font-bold text-sky-700">すべて見る</button>
        </div>
        <div className="space-y-3">
          {lectures.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} onClick={() => onOpenDetail(lecture.id)} />)}
        </div>
      </section>
    </div>
  );
}
