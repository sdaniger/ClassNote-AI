import type { TranscriptSegment } from "@/types/lecture";

export type TranscriptChunk = {
  start: number;
  end: number;
  text: string;
  segments: TranscriptSegment[];
};

export type ChunkTranscriptOptions = {
  maxDurationSec?: number;
  maxChars?: number;
};

export function chunkTranscript(segments: TranscriptSegment[], options: ChunkTranscriptOptions = {}): TranscriptChunk[] {
  const maxDurationSec = options.maxDurationSec ?? 600;
  const maxChars = options.maxChars ?? 2800;
  const validSegments = segments.filter((segment) => segment.text.trim().length > 0).sort((a, b) => a.start - b.start);

  if (validSegments.length === 0) return [];

  const chunks: TranscriptChunk[] = [];
  let current: TranscriptSegment[] = [];
  let currentChars = 0;
  let chunkStart = validSegments[0].start;

  for (const segment of validSegments) {
    const wouldExceedDuration = segment.end - chunkStart > maxDurationSec;
    const wouldExceedChars = currentChars + segment.text.length > maxChars;

    if (current.length > 0 && (wouldExceedDuration || wouldExceedChars)) {
      chunks.push(toChunk(current));
      current = [];
      currentChars = 0;
      chunkStart = segment.start;
    }

    current.push(segment);
    currentChars += segment.text.length;
  }

  if (current.length > 0) chunks.push(toChunk(current));
  return chunks;
}

function toChunk(segments: TranscriptSegment[]): TranscriptChunk {
  return {
    start: segments[0].start,
    end: segments[segments.length - 1].end,
    text: segments.map((segment) => segment.text).join("\n"),
    segments,
  };
}
