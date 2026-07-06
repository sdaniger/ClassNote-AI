"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-6">
            <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/70 p-8 text-center shadow-2xl backdrop-blur-3xl">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-100">
                <span className="text-2xl">!</span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-950">アプリでエラーが発生しました</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{this.state.error?.message ?? "不明なエラーです。"}</p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
              >
                リロード
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
