export function QuickNav({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-[22px] border border-white/65 bg-white/55 px-3 py-4 text-sm font-black text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-all active:scale-[0.97]">{label}</button>;
}
