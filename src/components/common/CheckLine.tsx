import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

export function CheckLine({ children }: { children: ReactNode }) {
  return <p className="flex gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{children}</p>;
}
