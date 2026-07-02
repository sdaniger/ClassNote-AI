import type { TranscriptSegment } from "@/types/lecture";
import { formatTimestamp } from "@/lib/formatTime";

export function formatTranscript(transcript: TranscriptSegment[]) {
  return transcript.map((segment) => `### ${formatTimestamp(segment.start)}\n\n${segment.text}`).join("\n\n");
}
