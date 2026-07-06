import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { formatJapaneseDate } from "@/lib/formatTime";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { MiniStat } from "@/components/common/MiniStat";
import type { Course } from "@/types/lecture";

export function CoursesScreen({ courses, onOpenCourse, onBack }: { courses: Course[]; onOpenCourse: (course: Course) => void; onBack: () => void }) {
  return <div className="space-y-5"><ScreenHeader eyebrow="Courses" title="科目別に整理" description="講義数、未復習、わからない場所、試験ポイントを科目ごとに確認できます。" onBack={onBack} />{courses.length === 0 ? <FeedbackEmptyState title="まだ項目がありません" message="科目がまだありません。講義を録音すると自動で整理されます。" /> : courses.map((course) => <button key={course.id} onClick={() => onOpenCourse(course)} className="w-full text-left"><GlassCard className="p-5"><div className="flex items-start justify-between"><div><h3 className="text-xl font-bold text-slate-950">{course.name}</h3><p className="mt-1 text-sm text-slate-500">最終録音: {course.lastRecordedAt ? formatJapaneseDate(course.lastRecordedAt) : "なし"}</p></div><StatusPill tone="blue">{course.lectureCount}講義</StatusPill></div><div className="mt-4 grid grid-cols-3 gap-2"><MiniStat label="未復習" value={`${course.unreviewedCount}`} /><MiniStat label="わからない" value={`${course.confusingMarkerCount}`} /><MiniStat label="試験" value={`${course.examLikelyPointCount}`} /></div></GlassCard></button>)}</div>;
}
