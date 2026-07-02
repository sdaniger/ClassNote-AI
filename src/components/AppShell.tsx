import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen justify-center overflow-hidden px-3 py-4 sm:px-6 sm:py-7">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-80px] top-[-120px] h-72 w-72 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-80 w-80 rounded-full bg-violet-300/35 blur-3xl" />
        <div className="absolute bottom-[-130px] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-200/35 blur-3xl" />
      </div>
      <section className="relative flex min-h-[calc(100vh-32px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[42px] border border-white/70 bg-white/24 shadow-[0_32px_100px_rgba(15,23,42,0.16)] backdrop-blur-[44px] sm:min-h-[900px]">
        <div className="absolute inset-x-14 top-2 h-1 rounded-full bg-white/70" />
        {children}
      </section>
    </main>
  );
}
