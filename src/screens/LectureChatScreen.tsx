import { ChatScreenShell } from "@/components/common/ChatScreenShell";
import type { ChatMessage, Lecture } from "@/types/lecture";

const lectureQuestionChips = ["この講義を簡単に要約して", "試験に出そうな部分は？", "わからない場所を解説して", "重要語句を教えて", "復習問題を作って", "マーカー箇所を解説して"];

export function LectureChatScreen({ lecture, messages, onAsk, onReference, onBack }: { lecture: Lecture; messages: ChatMessage[]; onAsk: (question: string) => void; onReference: (lectureId: string, timestamp?: number) => void; onBack: () => void }) {
  return <ChatScreenShell eyebrow="Lecture Chat" title={lecture.title} description={`${lecture.course} ・ 文字起こしとマーカーをもとに答えます`} messages={messages} chips={lectureQuestionChips} onAsk={onAsk} onReference={onReference} onBack={onBack} emptyText="この講義について質問できます。文字起こし・要約・マーカーをもとに、復習を手伝います。" />;
}
