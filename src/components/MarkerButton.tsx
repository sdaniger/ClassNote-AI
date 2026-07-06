import type { LucideIcon } from "lucide-react";

type MarkerButtonProps = {
  label: string;
  icon: LucideIcon;
  tone: "rose" | "amber" | "sky";
  onClick?: () => void;
  active?: boolean;
};

const toneClass = {
  rose: "from-rose-50/90 to-white/55 text-rose-700 ring-rose-200/75",
  amber: "from-amber-50/90 to-white/55 text-amber-800 ring-amber-200/75",
  sky: "from-sky-50/90 to-white/55 text-sky-700 ring-sky-200/75",
};

const activeToneClass = {
  rose: "from-rose-100 to-white/80 text-rose-700 ring-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.25)]",
  amber: "from-amber-100 to-white/80 text-amber-800 ring-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.25)]",
  sky: "from-sky-100 to-white/80 text-sky-700 ring-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.25)]",
};

export function MarkerButton({ label, icon: Icon, tone, onClick, active = false }: MarkerButtonProps) {
  const cls = active ? activeToneClass[tone] : toneClass[tone];
  return (
    <button onClick={onClick} aria-label={label} className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-[24px] bg-gradient-to-br text-sm font-bold shadow-[0_14px_34px_rgba(15,23,42,0.08)] ring-1 backdrop-blur-2xl transition-all active:scale-[0.96] ${cls}`}>
      <Icon className="h-5 w-5" aria-hidden />
      {label}
    </button>
  );
}
