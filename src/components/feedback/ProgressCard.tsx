import { GlassCard } from "@/components/GlassCard";

export function ProgressCard({ title, message, progress = 0 }: { title: string; message?: string; progress?: number }) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  return (
    <GlassCard className="p-5" role="status" aria-live="polite" aria-label={`${title}: ${progress}%`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Processing</p>
      <h3 className="mt-1 text-lg font-bold text-slate-950">{title}</h3>
      {message ? <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p> : null}
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/70 shadow-inner">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400 transition-all duration-500" style={{ width: `${safeProgress}%` }} />
      </div>
    </GlassCard>
  );
}
