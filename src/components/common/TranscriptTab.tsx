"use client";
import type { MutableRefObject } from "react";
import { useState } from "react";
import { Play } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { TimestampRow } from "@/components/TimestampRow";
import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { formatTimestamp } from "@/lib/formatTime";
import type { TranscriptSegment } from "@/types/lecture";

export function TranscriptTab({ transcript, jumpTimestamp, audioKey, audioToggleRef }: { transcript: TranscriptSegment[]; jumpTimestamp?: number; audioKey?: string; audioToggleRef?: MutableRefObject<(() => void) | null> }) {
  const [showAll, setShowAll] = useState(false);
  const [playerTime, setPlayerTime] = useState<number | undefined>();
  const visibleSegments = showAll ? transcript : transcript.slice(0, 24);
  const hiddenCount = transcript.length - visibleSegments.length;

  if (transcript.length === 0) {
    return (
      <div className="space-y-4">
        <FeedbackEmptyState title="文字起こしはまだありません" message="録音を停止すると自動で文字起こしが始まります。既存の音声ファイルを取り込んでもOKです。" />
      </div>
    );
  }

  const activeTime = jumpTimestamp ?? playerTime;

  return (
    <div className="space-y-4">
      <AudioPlayer audioKey={audioKey} onTimeUpdate={setPlayerTime} jumpTimestamp={jumpTimestamp} togglePlayRef={audioToggleRef} />
      <GlassCard solid className="p-4">
        <div className="flex items-center justify-between rounded-[22px] bg-slate-950 px-4 py-3 text-white">
          <span className="flex items-center gap-2 text-sm font-bold"><Play className="h-4 w-4" />文字起こし</span>
          <span className="text-sm font-bold tabular-nums">{visibleSegments.length} / {transcript.length}</span>
        </div>
        {activeTime !== undefined ? <p className="mt-3 rounded-2xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">{formatTimestamp(activeTime)} 付近</p> : null}
        <div className="mt-3 space-y-2">{visibleSegments.map((segment) => <TimestampRow key={`${segment.start}-${segment.end}`} segment={{ ...segment, active: activeTime !== undefined ? Math.abs(segment.start - activeTime) < 60 : segment.active }} />)}</div>
        {hiddenCount > 0 ? <GlassButton onClick={() => setShowAll(true)} className="mt-3 w-full">全文を読み込む（残り{hiddenCount}件）</GlassButton> : null}
      </GlassCard>
    </div>
  );
}
