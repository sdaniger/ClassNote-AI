export function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="mb-5 space-y-3">
        <div className="h-3 w-20 rounded-full bg-slate-200" />
        <div className="h-8 w-64 rounded-2xl bg-slate-200" />
        <div className="h-4 w-48 rounded-full bg-slate-200" />
      </div>
      <div className="rounded-[32px] bg-white/58 p-5">
        <div className="h-24 w-24 rounded-full bg-slate-200" />
        <div className="mt-4 h-4 w-32 rounded-full bg-slate-200" />
        <div className="mt-2 h-3 w-48 rounded-full bg-slate-200" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-[32px] bg-white/58" />)}
      </div>
    </div>
  );
}
