import { Sparkles } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <GlassCard solid className="p-6 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-[22px] bg-gradient-to-br from-sky-100 to-violet-100 text-violet-700 shadow-inner">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-500">{message}</p>
    </GlassCard>
  );
}
