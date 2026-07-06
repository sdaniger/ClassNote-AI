"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useToast, type ToastType } from "@/hooks/useToast";

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-2 p-4 sm:p-6">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            aria-live="polite"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl transition-all animate-in slide-in-from-right ${colors[toast.type]}`}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{toast.title}</p>
              {toast.message ? <p className="mt-0.5 text-xs leading-5 opacity-80">{toast.message}</p> : null}
            </div>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 rounded-full p-1 opacity-60 hover:opacity-100" aria-label="閉じる">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
