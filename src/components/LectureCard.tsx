import { ChevronRight, FileAudio2 } from "lucide-react";
import type { Lecture } from "@/types/lecture";
import { formatDuration, formatJapaneseDate } from "@/lib/formatTime";
import { StatusPill } from "./StatusPill";

export function LectureCard({ lecture, onClick }: { lecture: Lecture; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-[26px] border border-white/65 bg-white/58 p-4 text-left shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:bg-white/72 active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-100 to-violet-100 text-sky-700 ring-1 ring-white/80">
          <FileAudio2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[15px] font-bold tracking-tight text-slate-900">{lecture.title}</h3>
            <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">{lecture.course} ・ {formatJapaneseDate(lecture.recordedAt)} ・ {formatDuration(lecture.durationSec)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill status={lecture.audioStatus} />
            <StatusPill status={lecture.transcriptionStatus} />
            <StatusPill status={lecture.syncStatus} />
          </div>
        </div>
      </div>
    </button>
  );
}
