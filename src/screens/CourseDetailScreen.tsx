"use client";
import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { LectureCard } from "@/components/LectureCard";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { MiniStat } from "@/components/common/MiniStat";
import { FilterRow } from "@/components/common/FilterRow";
import { CheckLine } from "@/components/common/CheckLine";
import type { Course, Lecture, LectureMarker, LectureNote } from "@/types/lecture";

export function CourseDetailScreen({ courseName, lectures, courses, notes, markersByLecture, onOpenLecture, onBack }: { courseName: string; lectures: Lecture[]; courses: Course[]; notes: Record<string, LectureNote>; markersByLecture: Record<string, LectureMarker[]>; onOpenLecture: (lectureId: string) => void; onBack: () => void }) {
  const [sort, setSort] = useState<"date" | "unreviewed" | "important">("date");
  const course = courses.find((item) => item.name === courseName);
  const courseLectures = lectures.filter((lecture) => lecture.course === courseName).sort((a, b) => sort === "date" ? b.recordedAt.localeCompare(a.recordedAt) : sort === "unreviewed" ? Number(!notes[b.id]) - Number(!notes[a.id]) : (markersByLecture[b.id]?.length ?? 0) - (markersByLecture[a.id]?.length ?? 0));
  return <div className="space-y-5"><ScreenHeader eyebrow="Course" title={courseName || "科目"} description="復習進捗、重要語句、わからない場所を科目単位で確認します。" onBack={onBack} /><GlassCard className="p-5"><div className="grid grid-cols-3 gap-2"><MiniStat label="講義" value={`${course?.lectureCount ?? 0}`} /><MiniStat label="未復習" value={`${course?.unreviewedCount ?? 0}`} /><MiniStat label="わからない" value={`${course?.confusingMarkerCount ?? 0}`} /></div></GlassCard><FilterRow label="並び替え" values={["date", "unreviewed", "important"]} active={sort} onSelect={(value) => setSort((value as typeof sort) ?? "date")} /><GlassCard solid className="p-4"><h3 className="text-lg font-bold">講義一覧</h3><div className="mt-3 space-y-2">{courseLectures.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} onClick={() => onOpenLecture(lecture.id)} />)}</div></GlassCard><GlassCard className="p-5"><h3 className="text-lg font-bold">試験に出そうなポイント</h3><div className="mt-3 space-y-2">{courseLectures.flatMap((lecture) => notes[lecture.id]?.examLikelyPoints ?? []).slice(0, 6).map((point) => <CheckLine key={point}>{point}</CheckLine>)}</div></GlassCard></div>;
}
