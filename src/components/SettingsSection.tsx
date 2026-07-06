import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <GlassCard solid className="p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      <div className="space-y-2">{children}</div>
    </GlassCard>
  );
}
