import type { ComponentProps } from "react";
import { StatusPill } from "@/components/StatusPill";

export function StatusBox({ label, status }: { label: string; status: ComponentProps<typeof StatusPill>["status"] }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="mb-2 text-[11px] font-bold text-slate-400">{label}</p><StatusPill status={status} /></div>;
}
