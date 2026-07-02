"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { loadAudio } from "@/services/recording/recordingStorage";

type AudioPlayerProps = {
  audioKey?: string;
  onTimeUpdate?: (timeSec: number) => void;
  jumpTimestamp?: number;
  onClearJump?: () => void;
};

export function AudioPlayer({ audioKey, onTimeUpdate, jumpTimestamp, onClearJump }: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioKey) return;
    let url: string | null = null;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const blob = await loadAudio(audioKey);
        if (!blob) {
          setError("音声ファイルが見つかりません。");
          setLoading(false);
          return;
        }
        url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } catch {
        setError("音声ファイルの読み込みに失敗しました。");
      }
      setLoading(false);
    };

    load();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [audioKey]);

  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    const audio = audioRef.current;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onTime = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      onTimeUpdate?.(t);
    };
    const onLoaded = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [audioUrl, onTimeUpdate]);

  useEffect(() => {
    if (jumpTimestamp !== undefined && audioRef.current && isFinite(audioRef.current.duration)) {
      audioRef.current.currentTime = jumpTimestamp;
      audioRef.current.play().catch(() => {});
      onClearJump?.();
    }
  }, [jumpTimestamp, onClearJump]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, []);

  const skip = useCallback((delta: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + delta, audioRef.current.duration));
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  }, [duration]);

  if (!audioKey) return null;
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-[22px] bg-white/70 px-4 py-3 shadow-inner">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <span className="text-sm font-semibold text-slate-500">音声ファイルを読み込み中...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-[22px] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-[22px] bg-white/80 px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      <audio ref={audioRef} src={audioUrl ?? undefined} preload="metadata" />
      <div className="flex items-center gap-3">
        <button onClick={() => skip(-15)} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 transition-all active:scale-90 hover:bg-white/70">
          <SkipBack className="h-5 w-5" />
        </button>
        <button onClick={togglePlay} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-950 text-white shadow-lg transition-all active:scale-90">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button onClick={() => skip(15)} className="grid h-10 w-10 place-items-center rounded-full text-slate-600 transition-all active:scale-90 hover:bg-white/70">
          <SkipForward className="h-5 w-5" />
        </button>
        <div className="flex flex-1 flex-col gap-1">
          <div className="h-2 cursor-pointer rounded-full bg-slate-200" onClick={seek}>
            <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
          </div>
          <div className="flex justify-between text-[11px] font-bold tabular-nums text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
