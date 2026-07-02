import type { ButtonHTMLAttributes } from "react";

export function RetryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95 ${className}`} {...props}>{children}</button>;
}
