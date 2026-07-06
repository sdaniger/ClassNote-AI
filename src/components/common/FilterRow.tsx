import { GlassCard } from "@/components/GlassCard";

export function FilterRow({ label, values, active, onSelect }: { label: string; values: string[]; active?: string; onSelect: (value: string | undefined) => void }) {
  return <GlassCard className="p-3"><p className="mb-2 text-xs font-bold text-slate-500">{label}</p><div className="flex flex-wrap gap-2"><button onClick={() => onSelect(undefined)} className={`rounded-full px-3 py-2 text-xs font-bold ${!active ? "bg-slate-950 text-white" : "bg-white/65 text-slate-700"}`}>すべて</button>{values.map((value) => <button key={value} onClick={() => onSelect(value)} className={`rounded-full px-3 py-2 text-xs font-bold ${active === value ? "bg-slate-950 text-white" : "bg-white/65 text-slate-700"}`}>{value}</button>)}</div></GlassCard>;
}
