import { formatTimestamp } from "@/lib/formatTime";
import { StatusPill } from "@/components/StatusPill";
import type { SearchResult } from "@/types/lecture";

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="rounded bg-yellow-200 px-0.5">{part}</mark> : part
  );
}

export function SearchResultCard({ result, query, onClick }: { result: SearchResult; query: string; onClick: () => void }) {
  return <button onClick={onClick} className="w-full rounded-[24px] bg-slate-50 p-4 text-left transition-all active:scale-[0.99]"><div className="flex items-center justify-between gap-3"><h4 className="font-bold text-slate-950">{result.lectureTitle}</h4>{result.timestamp !== undefined ? <span className="rounded-full bg-sky-500 px-2.5 py-1 text-xs font-bold text-white tabular-nums">{formatTimestamp(result.timestamp)}</span> : null}</div><p className="mt-1 text-xs font-semibold text-slate-500">{result.course} ・ {result.source}</p><p className="mt-2 text-sm leading-6 text-slate-700">{highlightText(result.matchedText, query)}</p><div className="mt-2 flex flex-wrap gap-1.5">{result.tags.slice(0, 3).map((tag) => <StatusPill key={tag} tone={tag === "わからない" ? "rose" : tag === "試験に出そう" ? "violet" : "blue"}>{tag}</StatusPill>)}</div></button>;
}
