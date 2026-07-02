"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarDays, FileAudio2, Music2, UploadCloud } from "lucide-react";
import { formatFileSize } from "@/lib/formatFileSize";
import { audioModeOptions, getAudioModeShortLabel } from "@/lib/lectureStore";
import type { AudioMode, CreateLectureInput } from "@/types/lecture";
import { saveAudio } from "@/services/recording/recordingStorage";
import { GlassButton } from "./GlassButton";
import { GlassCard } from "./GlassCard";

type AudioImportPanelProps = {
  audioMode: AudioMode;
  onCreateLecture: (input: CreateLectureInput) => void;
  panelId?: string;
};

export function AudioImportPanel({ audioMode, onCreateLecture, panelId }: AudioImportPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [selectedAudioMode, setSelectedAudioMode] = useState<AudioMode>(audioMode);
  const [importing, setImporting] = useState(false);
  const importIdRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedMode = useMemo(
    () => audioModeOptions.find((option) => option.id === selectedAudioMode) ?? audioModeOptions[1],
    [selectedAudioMode],
  );

  const handleCreate = async () => {
    const fileName = selectedFile?.name ?? "imported-lecture.m4a";
    const audioKey = selectedFile ? `import_${++importIdRef.current}` : undefined;

    setImporting(true);

    let durationSec = 0;
    if (selectedFile) {
      try {
        await saveAudio(audioKey!, selectedFile);
        durationSec = await extractDuration(selectedFile);
      } catch {
        durationSec = 0;
      }
    }

    onCreateLecture({
      title,
      course,
      recordedAt: `${recordedAt}T00:00:00+09:00`,
      note,
      audioMode: selectedAudioMode,
      audioFile: fileName,
      originalFileName: selectedFile?.name,
      originalFileSizeBytes: selectedFile?.size,
      durationSec,
      source: "import",
      audioKey,
      audioMimeType: selectedFile?.type,
    });

    setTitle("");
    setCourse("");
    setNote("");
    setSelectedFile(null);
    setImporting(false);
  };

  async function extractDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audioRef.current = audio;
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const dur = isFinite(audio.duration) ? Math.round(audio.duration) : 0;
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve(dur);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve(0);
      };
      audio.src = url;
    });
  }

  return (
    <GlassCard id={panelId} className="overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Import Audio</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">音声ファイルを講義に追加</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">mp3 / wav / m4a / opus を取り込み、後でOpus圧縮とローカル文字起こしに進めます。</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br from-sky-100 to-violet-100 text-sky-700 shadow-inner">
          <UploadCloud className="h-6 w-6" />
        </div>
      </div>

      <label className="group relative block cursor-pointer rounded-[30px] border border-dashed border-sky-300/80 bg-white/58 p-5 text-center shadow-inner backdrop-blur-2xl transition-all hover:bg-white/75 active:scale-[0.99]">
        <input
          type="file"
          accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/ogg,.mp3,.wav,.m4a,.opus"
          className="sr-only"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-white shadow-[0_16px_35px_rgba(15,23,42,0.22)] transition-transform group-hover:-translate-y-0.5">
          <Music2 className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-900">音声ファイルを選択</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">対応形式: mp3 / wav / m4a / opus</p>
        <div className="mt-3 flex justify-center gap-1.5">
          {['mp3', 'wav', 'm4a', 'opus'].map((format) => <span key={format} className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-700">{format}</span>)}
        </div>
      </label>

      {selectedFile ? (
        <div className="mt-3 flex items-center gap-3 rounded-[22px] bg-white/70 p-3 shadow-inner">
          <FileAudio2 className="h-5 w-5 shrink-0 text-sky-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{selectedFile.name}</p>
            <p className="text-xs font-semibold text-slate-500">元ファイル {formatFileSize(selectedFile.size)}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <TextField label="講義タイトル" value={title} onChange={setTitle} placeholder="例: 線形代数 第13回" />
        <TextField label="科目名" value={course} onChange={setCourse} placeholder="例: 情報リテラシー" />
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-500"><CalendarDays className="h-3.5 w-3.5" />日付</span>
          <input className="w-full rounded-2xl border border-white/70 bg-white/78 px-4 py-3 text-sm font-semibold text-slate-800 shadow-inner outline-none transition focus:ring-2 focus:ring-sky-200" type="date" value={recordedAt} onChange={(event) => setRecordedAt(event.target.value)} />
        </label>
        <TextField label="メモ" value={note} onChange={setNote} placeholder="講義に関するメモ（任意）" />
      </div>

      <div className="mt-4 rounded-[24px] bg-white/62 p-3 shadow-inner">
        <p className="text-xs font-bold text-slate-500">取り込み後の保存モード</p>
        <div className="mt-2 grid gap-2">
          {audioModeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedAudioMode(option.id)}
              className={`rounded-2xl px-3 py-2.5 text-left transition-all active:scale-[0.99] ${option.id === selectedAudioMode ? "bg-sky-50 ring-1 ring-sky-200" : "bg-white/65 hover:bg-white"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">{option.title}</span>
                <span className="text-[11px] font-black text-sky-700">90分 約{option.estimated90MinMb}MB</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-white/55 px-3 py-3 shadow-inner">
          <p className="text-[10px] font-bold text-slate-400">保存モード</p>
          <p className="mt-1 text-xs font-black text-slate-800">{getAudioModeShortLabel(selectedAudioMode)}</p>
        </div>
        <div className="rounded-2xl bg-white/55 px-3 py-3 shadow-inner">
          <p className="text-[10px] font-bold text-slate-400">推定容量</p>
          <p className="mt-1 text-xs font-black text-slate-800">90分 約{selectedMode.estimated90MinMb}MB</p>
        </div>
      </div>

      <GlassButton onClick={handleCreate} variant="primary" className="mt-4 w-full" disabled={importing}>{importing ? "ファイルを保存中..." : "講義として追加"}</GlassButton>
    </GlassCard>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-500">{label}</span>
      <input
        className="w-full rounded-2xl border border-white/70 bg-white/78 px-4 py-3 text-sm font-semibold text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
