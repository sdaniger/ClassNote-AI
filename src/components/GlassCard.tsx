import type { HTMLAttributes, ReactNode } from "react";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  solid?: boolean;
};

export function GlassCard({ children, className = "", solid = false, ...props }: GlassCardProps) {
  return (
    <div
      className={`rounded-[32px] border border-white/60 ${solid ? "bg-white/88" : "bg-white/58 backdrop-blur-3xl"} shadow-[0_24px_80px_rgba(15,23,42,0.12)] ring-1 ring-white/35 transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
