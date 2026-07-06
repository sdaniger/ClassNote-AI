"use client";

import type { ReactNode } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function AppShell({ children }: { children: ReactNode }) {
  const online = useOnlineStatus();

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg">
        メインコンテンツへスキップ
      </a>
      <main id="main-content" className="relative flex min-h-screen justify-center overflow-hidden px-3 py-4 sm:px-6 sm:py-7">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-80px] top-[-120px] h-72 w-72 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-80 w-80 rounded-full bg-violet-300/35 blur-3xl" />
        <div className="absolute bottom-[-130px] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-200/35 blur-3xl" />
      </div>
      <section className="relative flex min-h-[calc(100vh-32px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[42px] border border-white/70 bg-white/24 shadow-[0_32px_100px_rgba(15,23,42,0.16)] backdrop-blur-[44px] sm:min-h-[900px]">
        <div className="absolute inset-x-14 top-2 h-1 rounded-full bg-white/70" />
        {!online && (
          <div className="absolute left-0 right-0 top-0 z-20 animate-[slideDown_0.3s_ease-out] bg-amber-400 px-4 py-2.5 text-center text-sm font-bold text-amber-900 shadow-md">
            🛜 オフラインです
          </div>
        )}
        {children}
      </section>
    </main>
    </>
  );
}
