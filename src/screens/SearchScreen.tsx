"use client";
import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { FilterRow } from "@/components/common/FilterRow";
import { SearchResultCard } from "@/components/common/SearchResultCard";
import { searchLectures } from "@/services/search/searchLectures";
import { buildSearchIndex } from "@/services/search/buildSearchIndex";
import type { Course, LectureTag, SearchResult } from "@/types/lecture";

export function SearchScreen({ index, courses, tags, onOpenResult, onBack }: { index: ReturnType<typeof buildSearchIndex>; courses: Course[]; tags: LectureTag[]; onOpenResult: (result: SearchResult) => void; onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState<string | undefined>();
  const [tag, setTag] = useState<string | undefined>();
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("classnote-ai:search-history") ?? "[]") as string[]; } catch { return []; }
  });
  const results = searchLectures(index, query, { course, tag, period: "all" });
  const uniqueTags = [...new Set(tags.map((item) => item.name))];

  const saveToHistory = (q: string) => {
    if (!q.trim()) return;
    setHistory((prev) => {
      const next = [q, ...prev.filter((h) => h !== q)].slice(0, 10);
      try { localStorage.setItem("classnote-ai:search-history", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleOpenResult = (result: SearchResult) => {
    saveToHistory(query);
    onOpenResult(result);
  };

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow="Search" title="講義を探す" description="タイトル、科目、文字起こし、要約、マーカーをまとめて検索できます。" onBack={onBack} />
      <div className="rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveToHistory(query); }} className="w-full bg-transparent text-[15px] font-semibold outline-none placeholder:text-slate-400" placeholder="講義を検索..." /></div>
      {history.length > 0 ? <GlassCard className="p-4"><p className="text-xs font-bold text-slate-500">最近の検索</p><div className="mt-2 flex flex-wrap gap-2">{history.map((item) => <button key={item} onClick={() => setQuery(item)} className="rounded-full bg-white/65 px-3 py-2 text-xs font-bold text-slate-700">{item}</button>)}</div></GlassCard> : null}
      <div className="space-y-2"><FilterRow label="科目" values={courses.map((item) => item.name)} active={course} onSelect={setCourse} /><FilterRow label="タグ" values={uniqueTags} active={tag} onSelect={setTag} /></div>
      <GlassCard solid className="p-4"><h3 className="text-lg font-bold text-slate-900">検索結果</h3><div className="mt-3 space-y-2">{results.length === 0 ? <FeedbackEmptyState title="まだ項目がありません" message="検索結果がありません。別のキーワードを試してください。" /> : results.map((result) => <SearchResultCard key={`${result.lectureId}-${result.source}-${result.timestamp}-${result.matchedText}`} result={result} query={query} onClick={() => handleOpenResult(result)} />)}</div></GlassCard>
    </div>
  );
}
