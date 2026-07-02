import type { SearchResult } from "@/types/lecture";
import type { SearchFilters } from "./searchTypes";
import type { SearchIndexItem } from "./buildSearchIndex";

export function searchLectures(index: SearchIndexItem[], query: string, filters: SearchFilters = {}): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  const now = Date.now();

  return index
    .filter((item) => {
      if (filters.course && item.course !== filters.course) return false;
      if (filters.tag && !item.tags.includes(filters.tag)) return false;
      if (filters.period && filters.period !== "all") {
        const days = filters.period === "week" ? 7 : 31;
        if (now - new Date(item.recordedAt).getTime() > days * 24 * 60 * 60 * 1000) return false;
      }
      if (!normalized) return item.source === "transcript" || item.source === "summary";
      return item.text.toLowerCase().includes(normalized) || item.lectureTitle.toLowerCase().includes(normalized) || item.course.toLowerCase().includes(normalized) || item.tags.some((tag) => tag.toLowerCase().includes(normalized));
    })
    .slice(0, 40)
    .map((item) => ({ lectureId: item.lectureId, lectureTitle: item.lectureTitle, course: item.course, matchedText: excerpt(item.text, normalized), source: item.source, timestamp: item.timestamp, tags: item.tags }));
}

function excerpt(text: string, query: string) {
  if (!query) return text.length > 92 ? `${text.slice(0, 92)}...` : text;
  const index = text.toLowerCase().indexOf(query);
  if (index < 0) return text.length > 92 ? `${text.slice(0, 92)}...` : text;
  const start = Math.max(0, index - 34);
  const end = Math.min(text.length, index + query.length + 54);
  return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
}
