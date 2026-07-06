import { GlassCard } from "@/components/GlassCard";
import { LectureCard } from "@/components/LectureCard";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import type { Lecture, LectureTag } from "@/types/lecture";

export function TagsScreen({ tagsByLecture, selectedTag, lectures, onSelectTag, onOpenLecture, onBack }: { tagsByLecture: Record<string, LectureTag[]>; selectedTag: string | null; lectures: Lecture[]; onSelectTag: (tag: string | null) => void; onOpenLecture: (lectureId: string) => void; onBack: () => void }) {
  const allTags = Object.values(tagsByLecture).flat();
  const names = [...new Set(allTags.map((tag) => tag.name))];
  const filtered = selectedTag ? lectures.filter((lecture) => tagsByLecture[lecture.id]?.some((tag) => tag.name === selectedTag)) : [];
  return <div className="space-y-5"><ScreenHeader eyebrow="Tags" title="タグで整理" description="自動生成タグと手動タグを分けて、講義をすばやく絞り込みます。" onBack={onBack} /><GlassCard className="p-5"><div className="flex flex-wrap gap-2">{names.length === 0 ? <FeedbackEmptyState title="まだ項目がありません" message="タグがまだありません。" /> : names.map((name) => <button key={name} onClick={() => onSelectTag(selectedTag === name ? null : name)} className={`rounded-full px-4 py-2 text-sm font-bold ${selectedTag === name ? "bg-slate-950 text-white" : "bg-white/70 text-slate-700"}`}>#{name} <span className="text-xs opacity-70">{allTags.filter((tag) => tag.name === name).length}</span></button>)}</div></GlassCard>{selectedTag ? <GlassCard solid className="p-4"><h3 className="text-lg font-bold">#{selectedTag} の講義</h3><div className="mt-3 space-y-2">{filtered.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} onClick={() => onOpenLecture(lecture.id)} />)}</div></GlassCard> : null}</div>;
}
