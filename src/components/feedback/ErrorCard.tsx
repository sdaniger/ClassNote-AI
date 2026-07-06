import { AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RetryButton } from "./RetryButton";

export function ErrorCard({ title = "問題が発生しました", message, actionLabel, onRetry }: { title?: string; message: string; actionLabel?: string; onRetry?: () => void }) {
  return (
    <GlassCard solid className="p-5" role="alert" aria-live="polite">
      <div className="flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
          {onRetry ? <RetryButton className="mt-3" onClick={onRetry}>{actionLabel ?? "もう一度試す"}</RetryButton> : null}
        </div>
      </div>
    </GlassCard>
  );
}
