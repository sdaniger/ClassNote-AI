"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState as FeedbackEmptyState } from "@/components/feedback/EmptyState";
import { ScreenHeader } from "./ScreenHeader";
import { ChatBubble } from "./ChatBubble";
import type { ChatMessage } from "@/types/lecture";

export function ChatScreenShell({ eyebrow, title, description, messages, chips, emptyText, onAsk, onReference, onBack }: { eyebrow: string; title: string; description: string; messages: ChatMessage[]; chips: string[]; emptyText: string; onAsk: (question: string) => void; onReference: (lectureId: string, timestamp?: number) => void; onBack: () => void }) {
  const [draft, setDraft] = useState("");
  const submit = (question: string) => {
    const text = question.trim();
    if (!text) return;
    setDraft("");
    onAsk(text);
  };

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow={eyebrow} title={title} description={description} onBack={onBack} />
      <GlassCard className="p-4"><p className="text-xs font-bold text-slate-500">おすすめ質問</p><div className="mt-3 flex flex-wrap gap-2">{chips.map((chip) => <button key={chip} onClick={() => submit(chip)} className="rounded-full bg-white/70 px-3 py-2 text-xs font-bold text-slate-700 shadow-inner">{chip}</button>)}</div></GlassCard>
      <GlassCard solid className="p-4"><div className="space-y-3">{messages.length === 0 ? <FeedbackEmptyState title="まだ項目がありません" message={emptyText} /> : messages.map((message) => <ChatBubble key={message.id} message={message} onReference={onReference} />)}</div></GlassCard>
      <div className="sticky bottom-24 rounded-[28px] border border-white/70 bg-white/72 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur-3xl">
        <div className="flex items-center gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(draft); }} className="min-w-0 flex-1 rounded-full bg-white px-4 py-3 text-sm font-semibold outline-none placeholder:text-slate-400" placeholder="講義について質問する" /><button onClick={() => submit(draft)} className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-white transition-all active:scale-95"><Send className="h-4 w-4" /></button></div>
      </div>
    </div>
  );
}
