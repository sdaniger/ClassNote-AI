"use client";
import type { MutableRefObject } from "react";
import { useState } from "react";
import { Edit3, Star, Trash2 } from "lucide-react";
import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { SegmentedTabs } from "@/components/SegmentedTabs";
import { StatusPill } from "@/components/StatusPill";
import { OverviewTab } from "@/components/common/OverviewTab";
import { TranscriptTab } from "@/components/common/TranscriptTab";
import { TimelineTab } from "@/components/common/TimelineTab";
import { ReviewTab } from "@/components/common/ReviewTab";
import { MetaItem } from "@/components/common/MetaItem";
import { ObsidianExportPanel } from "@/components/ObsidianExportPanel";
import { formatDuration } from "@/lib/formatTime";
import { getAudioModeShortLabel } from "@/lib/lectureStore";
import type { DetailTab, Lecture, LectureMarker, LectureNote, ObsidianSettings, SummaryGenerationStep, TranscriptSegment } from "@/types/lecture";

const detailTabs: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "transcript", label: "文字起こし" },
  { id: "timeline", label: "タイムライン" },
  { id: "review", label: "復習" },
  { id: "obsidian", label: "Obsidian" },
];

export function LectureDetailScreen({
  lecture,
  note,
  markdown,
  obsidianSettings,
  transcript,
  markers,
  generationStep,
  generationError,
  jumpTimestamp,
  activeTab,
  onTabChange,
  onCourseOpen,
  onOpenChat,
  onGenerateNote,
  onDeleteLecture,
  onUpdateLecture,
  onBack,
  transcriptionProgress,
  audioToggleRef,
}: {
  lecture: Lecture;
  note?: LectureNote;
  markdown?: string;
  obsidianSettings: ObsidianSettings;
  transcript: TranscriptSegment[];
  markers: LectureMarker[];
  generationStep: SummaryGenerationStep;
  generationError: string | null;
  jumpTimestamp?: number;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onCourseOpen: (course: string) => void;
  onOpenChat: () => void;
  onGenerateNote: (lecture: Lecture) => void;
  onDeleteLecture: (lectureId: string) => void;
  onUpdateLecture: (lectureId: string, patch: Partial<Lecture>) => void;
  onBack: () => void;
  transcriptionProgress: number | null;
  audioToggleRef?: MutableRefObject<(() => void) | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(lecture.title);
  const [editCourse, setEditCourse] = useState(lecture.course);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const startEditing = () => {
    setEditTitle(lecture.title);
    setEditCourse(lecture.course);
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdateLecture(lecture.id, { title: editTitle.trim() || lecture.title, course: editCourse.trim() || lecture.course });
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-2">
                <input className="w-full rounded-2xl border border-white/70 bg-white/78 px-4 py-2 text-lg font-bold text-slate-800 shadow-inner outline-none" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="講義タイトル" />
                <input className="w-full rounded-2xl border border-white/70 bg-white/78 px-4 py-2 text-sm font-semibold text-slate-800 shadow-inner outline-none" value={editCourse} onChange={(e) => setEditCourse(e.target.value)} placeholder="科目名" />
                <div className="flex gap-2">
                  <GlassButton onClick={saveEdit} variant="primary">保存</GlassButton>
                  <GlassButton onClick={() => setEditing(false)}>キャンセル</GlassButton>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => onCourseOpen(lecture.course)} className="text-xs font-black uppercase tracking-[0.22em] text-violet-700/80">{lecture.course}</button>
                <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-tight text-slate-950">{lecture.title}</h1>
              </>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {!editing && (
              <>
                <button onClick={startEditing} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/65 text-slate-600 shadow-md backdrop-blur-2xl transition-all active:scale-95 hover:bg-white/80" aria-label="編集"><Edit3 className="h-5 w-5" /></button>
                {showDeleteConfirm ? (
                  <div className="flex gap-2">
                    <button onClick={() => { onDeleteLecture(lecture.id); setShowDeleteConfirm(false); }} className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-md transition-all active:scale-95">削除</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="rounded-2xl bg-white/65 px-4 py-2 text-sm font-bold text-slate-600 shadow-md backdrop-blur-2xl transition-all active:scale-95">取消</button>
                  </div>
                ) : (
                  <button onClick={() => setShowDeleteConfirm(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/65 text-rose-500 shadow-md backdrop-blur-2xl transition-all active:scale-95 hover:bg-white/80" aria-label="削除"><Trash2 className="h-5 w-5" /></button>
                )}
              </>
            )}
          </div>
        </div>
        <GlassCard className="p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MetaItem label="科目" value={lecture.course} />
            <MetaItem label="録音時間" value={formatDuration(lecture.durationSec)} />
            <MetaItem label="音声サイズ" value={`${lecture.audioSizeMb}MB`} />
            <MetaItem label="音声" value={getAudioModeShortLabel(lecture.audioMode)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill status={lecture.audioStatus} />
            <StatusPill status={lecture.transcriptionStatus} />
            <StatusPill status={lecture.summaryStatus} />
            <StatusPill status={lecture.obsidianExportStatus} />
            <StatusPill status={lecture.syncStatus} />
          </div>
          {transcriptionProgress !== null && lecture.transcriptionStatus === "transcribing" ? (
            <div className="mt-3" role="status" aria-live="polite" aria-label="文字起こし処理中">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>文字起こし中...</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-sky-400" />
              </div>
            </div>
          ) : null}
          {lecture.note ? <p className="mt-3 rounded-2xl bg-white/55 px-3 py-3 text-sm leading-6 text-slate-600">{lecture.note}</p> : null}
        </GlassCard>
      </header>

      <SegmentedTabs items={detailTabs} active={activeTab} onChange={onTabChange} />
      <GlassButton onClick={onOpenChat} variant="primary" className="w-full"><Star className="h-4 w-4" />この講義について質問する</GlassButton>

      {activeTab === "overview" ? <OverviewTab lecture={lecture} note={note} hasTranscript={transcript.length > 0} generationStep={generationStep} generationError={generationError} onGenerateNote={() => onGenerateNote(lecture)} onOpenObsidian={() => onTabChange("obsidian")} /> : null}
      {activeTab === "transcript" ? <TranscriptTab transcript={transcript} jumpTimestamp={jumpTimestamp} audioKey={lecture.audioKey} audioToggleRef={audioToggleRef} /> : null}
      {activeTab === "timeline" ? <TimelineTab note={note} markers={markers} /> : null}
      {activeTab === "review" ? <ReviewTab note={note} generationStep={generationStep} generationError={generationError} onGenerateNote={() => onGenerateNote(lecture)} /> : null}
      {activeTab === "obsidian" ? <ObsidianExportPanel lecture={lecture} note={note} markdown={markdown} settings={obsidianSettings} transcript={transcript} markers={markers} onGenerateNote={() => onGenerateNote(lecture)} onExportSuccess={() => onUpdateLecture(lecture.id, { obsidianExportStatus: "exported" })} /> : null}
    </div>
  );
}
