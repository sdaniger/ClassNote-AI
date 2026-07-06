export function MetaItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white/55 p-3"><p className="text-[11px] font-bold text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-800">{value}</p></div>;
}
