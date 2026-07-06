export function ScreenHeader({ eyebrow, title, description, onBack }: { eyebrow: string; title: string; description?: string; onBack?: () => void }) {
  return (
    <header className="mb-5">
      <div className="flex items-center gap-3">
        {onBack ? <button onClick={onBack} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/65 text-slate-600 shadow-sm backdrop-blur-2xl transition-all active:scale-95 hover:bg-white/80" aria-label="戻る"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></button> : null}
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700/80">{eyebrow}</p>
          <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-slate-950">{title}</h1>
        </div>
      </div>
      {description ? <p className="mt-2 text-[15px] leading-7 text-slate-600">{description}</p> : null}
    </header>
  );
}
