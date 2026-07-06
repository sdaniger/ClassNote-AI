import { formatTimestamp } from "@/lib/formatTime";
import type { ChatMessage } from "@/types/lecture";

export function ChatBubble({ message, onReference }: { message: ChatMessage; onReference: (lectureId: string, timestamp?: number) => void }) {
  const isUser = message.role === "user";
  return <div className={`rounded-[26px] p-4 ${isUser ? "ml-8 bg-slate-950 text-white" : "mr-6 bg-white shadow-inner"}`}><p className={`whitespace-pre-wrap text-sm leading-7 ${isUser ? "text-white" : "text-slate-700"}`}>{message.content}</p>{!isUser && message.references?.length ? <div className="mt-3 space-y-2"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">参照</p>{message.references.map((ref, index) => <button key={`${ref.lectureId}-${ref.timestamp}-${index}`} onClick={() => onReference(ref.lectureId, ref.timestamp)} className="w-full rounded-2xl bg-sky-50 px-3 py-2 text-left text-xs text-sky-900"><span className="font-black">{ref.timestamp !== undefined ? `${formatTimestamp(ref.timestamp)} ` : ""}{ref.lectureTitle}</span><br />{ref.text}</button>)}</div> : null}</div>;
}
