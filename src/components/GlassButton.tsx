import type { ButtonHTMLAttributes, ReactNode } from "react";

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

const variants = {
  primary: "bg-slate-950 text-white shadow-[0_16px_34px_rgba(15,23,42,0.22)] hover:bg-slate-800",
  secondary: "border border-white/60 bg-white/62 text-slate-800 shadow-[0_12px_34px_rgba(15,23,42,0.08)] backdrop-blur-2xl hover:bg-white/80",
  danger: "bg-rose-500 text-white shadow-[0_16px_38px_rgba(244,63,94,0.30)] hover:bg-rose-600",
  ghost: "bg-white/25 text-slate-700 hover:bg-white/50",
};

export function GlassButton({ children, className = "", variant = "secondary", ...props }: GlassButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
