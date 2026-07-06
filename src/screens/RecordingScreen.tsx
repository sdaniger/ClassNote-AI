"use client";
import type { MutableRefObject } from "react";
import { useEffect, useState } from "react";
import { CirclePause, CircleStop, ClipboardList, FileAudio2, HelpCircle, Mic, Play, Star } from "lucide-react";
import { ErrorCard } from "@/components/feedback/ErrorCard";
import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { MarkerButton } from "@/components/MarkerButton";
import { ProgressCard } from "@/components/feedback/ProgressCard";
import { RecordingOrb } from "@/components/RecordingOrb";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { addLog } from "@/services/logger/logger";
import { formatDurationMs } from "@/lib/formatTime";
import { getAudioModeShortLabel } from "@/lib/lectureStore";
import { useRecordingController } from "@/services/recording/useRecordingController";
import type { AudioMode, Lecture } from "@/types/lecture";
import type { RecordingResult } from "@/services/recording/recordingService";

export function RecordingScreen({ lecture, audioMode, onImport, onRecordingComplete, onBack, recordingActionsRef }: { lecture?: Lecture; audioMode: AudioMode; onImport: () => void; onRecordingComplete: (title: string, course: string, result: RecordingResult, audioMode: AudioMode) => Promise<void>; onBack: () => void; recordingActionsRef?: MutableRefObject<{ toggleRecording: () => void; addConfusedMarker: () => void } | null> }) {
  const ctrl = useRecordingController();
  const [title, setTitle] = useState(lecture?.title ?? "");
  const [course, setCourse] = useState(lecture?.course ?? "");
  const isRecording = ctrl.status === "recording";
  const isPaused = ctrl.status === "paused";
  const isIdle = ctrl.status === "idle";
  const isFinalizing = ctrl.status === "finalizing";
  const hasError = ctrl.status === "error";

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isRecording || isPaused) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isRecording, isPaused]);

  const handleStop = async () => {
    try {
      const result = await ctrl.stop();
      await onRecordingComplete(title, course, result, audioMode);
    } catch (err) {
      addLog({ level: "error", area: "recording", message: `録音停止処理エラー: ${err instanceof Error ? err.message : err}` });
    }
  };

  useEffect(() => {
    if (!recordingActionsRef) return;
    recordingActionsRef.current = {
      toggleRecording: () => {
        if (isIdle) {
          ctrl.start(audioMode);
        } else if (isRecording || isPaused) {
          handleStop();
        }
      },
      addConfusedMarker: () => {
        if (isRecording || isPaused) ctrl.addMarker("confused", "わからない");
      },
    };
  });

  if (!ctrl.supported) {
    return (
      <div className="space-y-5">
        <ScreenHeader eyebrow="Recording" title="録音" description="Webブラウザからの録音には対応していません。" onBack={onBack} />
        <ErrorCard title="このブラウザは録音に対応していません" message="Chrome, Edge, Firefox のいずれかをお使いください。Safari は一部制限があります。" />
        <GlassButton onClick={onImport} variant="primary" className="w-full"><FileAudio2 className="h-4 w-4" />音声ファイルを取り込む</GlassButton>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow="Recording" title={isRecording ? "録音中" : isPaused ? "一時停止中" : isFinalizing ? "保存中..." : "最初の講義を録音"} description="講義に集中できるよう、録音中は余計な表示を減らします。" onBack={onBack} />

      {hasError ? <ErrorCard title="録音でエラーが発生しました" message={ctrl.error ?? "不明なエラーです。"} actionLabel="もう一度試す" onRetry={() => ctrl.start(audioMode)} /> : null}

      <GlassCard className="p-6 text-center">
        <p className="text-sm font-bold text-rose-600">{lecture?.title ?? (title || "録音準備完了")}</p>
        <div className="mt-2 text-5xl font-semibold tracking-tight text-slate-950 tabular-nums">{formatDurationMs(ctrl.elapsedMs)}</div>
        <div className={`mx-auto mt-1 h-1.5 w-16 rounded-full ${isRecording ? "bg-rose-500" : isPaused ? "bg-amber-400" : "bg-rose-300"}`} />
        <div className="mt-2 flex justify-center"><RecordingOrb status={isRecording ? "recording" : isPaused ? "paused" : "idle"} /></div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <FileAudio2 className="h-4 w-4" /> {getAudioModeShortLabel(audioMode)} ・ クラウド送信なし
        </div>
      </GlassCard>

      {isIdle ? (
        <GlassCard solid className="p-5">
          <h3 className="text-lg font-bold text-slate-950">講義情報を入力</h3>
          <div className="mt-3 grid gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-500">講義タイトル</span>
              <input className="w-full rounded-2xl border border-white/70 bg-white/78 px-4 py-3 text-sm font-semibold text-slate-800 shadow-inner outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="講義タイトル" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-500">科目名</span>
              <input className="w-full rounded-2xl border border-white/70 bg-white/78 px-4 py-3 text-sm font-semibold text-slate-800 shadow-inner outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="科目名" />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <GlassButton variant="primary" onClick={() => ctrl.start(audioMode)}><Mic className="h-4 w-4" />録音開始</GlassButton>
            <GlassButton onClick={onImport}><FileAudio2 className="h-4 w-4" />音声を取り込む</GlassButton>
          </div>
        </GlassCard>
      ) : null}

      {isRecording || isPaused ? (
        <>
          <div className="flex gap-3">
            <MarkerButton label="わからない" icon={HelpCircle} tone="rose" onClick={() => ctrl.addMarker("confused", "わからない")} />
            <MarkerButton label="重要" icon={Star} tone="amber" onClick={() => ctrl.addMarker("important", "重要")} />
            <MarkerButton label="課題" icon={ClipboardList} tone="sky" onClick={() => ctrl.addMarker("task", "課題")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {isRecording ? <GlassButton onClick={ctrl.pause}><CirclePause className="h-5 w-5" />一時停止</GlassButton> : <GlassButton onClick={ctrl.resume}><Play className="h-5 w-5" />再開</GlassButton>}
            <GlassButton variant="danger" onClick={handleStop} disabled={isFinalizing}><CircleStop className="h-5 w-5" />停止</GlassButton>
          </div>
          {ctrl.markers.length > 0 ? (
            <GlassCard solid className="p-4">
              <h3 className="text-base font-bold text-slate-900">マーカー ({ctrl.markers.length}件)</h3>
              <div className="mt-3 space-y-2">
                {ctrl.markers.map((m, i) => (
                  <div key={`${m.type}-${i}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700">{m.label}</span>
                    <span className="text-xs font-bold tabular-nums text-slate-400">{formatDurationMs(m.timeMs)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : null}
        </>
      ) : null}

      {isFinalizing ? <ProgressCard title="音声を保存中" message="録音データを保存しています。しばらくお待ちください。" progress={50} /> : null}
    </div>
  );
}
