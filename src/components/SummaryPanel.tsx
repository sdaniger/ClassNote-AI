import { Sparkles } from "lucide-react";
import { GlassCard } from "./GlassCard";

export function SummaryPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard solid className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-sky-100 text-violet-700">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
      </div>
      <div className="text-sm leading-7 text-slate-700">{children}</div>
    </GlassCard>
  );
}
