export function ReminderToggle({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return <button onClick={onClick} role="switch" aria-checked={checked} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-left"><span className="text-sm font-bold text-slate-800">{label}</span><span className={`h-7 w-12 rounded-full p-1 ${checked ? "bg-sky-500" : "bg-slate-300"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : ""}`} /></span></button>;
}
