type SegmentedTabsProps<T extends string> = {
  items: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
};

export function SegmentedTabs<T extends string>({ items, active, onChange }: SegmentedTabsProps<T>) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full border border-white/65 bg-white/52 p-1 shadow-inner backdrop-blur-2xl">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition-all ${isActive ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.20)]" : "text-slate-500 hover:bg-white/70"}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
