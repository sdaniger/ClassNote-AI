import { ChatScreenShell } from "@/components/common/ChatScreenShell";
import type { ChatMessage } from "@/types/lecture";

const globalQuestionChips = ["試験に出そうな講義を教えて", "未復習の重要ポイントをまとめて", "わからないマーカーが多い部分を教えて", "全講義から重要語句を抽出して"];

export function GlobalChatScreen({ messages, onAsk, onReference, onBack }: { messages: ChatMessage[]; onAsk: (question: string) => void; onReference: (lectureId: string, timestamp?: number) => void; onBack: () => void }) {
  return <ChatScreenShell eyebrow="Study Chat" title="全講義に質問" description="検索と講義データを使って、関連講義を探してから答えます。" messages={messages} chips={globalQuestionChips} onAsk={onAsk} onReference={onReference} onBack={onBack} emptyText="全講義を横断して質問できます。未復習、試験対策、わからない場所をまとめて確認できます。" />;
}
