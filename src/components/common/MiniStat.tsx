export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/55 px-2 py-3 shadow-inner">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 truncate text-[11px] font-black text-slate-800">{value}</p>
    </div>
  );
}
