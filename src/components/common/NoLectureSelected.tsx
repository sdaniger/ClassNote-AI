import { Mic } from "lucide-react";
import { GlassButton } from "@/components/GlassButton";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";

export function NoLectureSelected({ onRecord }: { onRecord: () => void }) {
  return <div className="space-y-4"><FeedbackEmptyState title="講義がまだありません" message="まずは録音するか、既存の音声ファイルを取り込んでください。" /><GlassButton onClick={onRecord} variant="primary" className="w-full"><Mic className="h-4 w-4" />録音画面へ</GlassButton></div>;
}
