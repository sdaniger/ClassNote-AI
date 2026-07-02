import { Laptop, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { GlassButton } from "./GlassButton";
import { GlassCard } from "./GlassCard";
import { StatusPill } from "./StatusPill";

export function SyncDeviceCard() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Local Wi-Fi Sync</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Windows Studio</h3>
          <p className="mt-1 text-sm text-slate-500">DESKTOP-LINEAR ・ 同じWi-Fi</p>
        </div>
        <StatusPill status="windows_pending" />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="grid h-24 place-items-center rounded-[26px] bg-white/60 shadow-inner">
          <Smartphone className="h-9 w-9 text-slate-700" />
          <span className="text-[11px] font-bold text-violet-700">mobile_draft</span>
        </div>
        <div className="relative grid h-12 w-12 place-items-center rounded-full bg-sky-500 text-white shadow-lg">
          <Wifi className="h-5 w-5" />
          <span className="absolute inset-0 rounded-full bg-sky-400/50" style={{ animation: "softPulse 2s ease-in-out infinite" }} />
        </div>
        <div className="grid h-24 place-items-center rounded-[26px] bg-white/60 shadow-inner">
          <Laptop className="h-9 w-9 text-slate-700" />
          <span className="text-[11px] font-bold text-emerald-700">desktop_final</span>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-sky-100 bg-sky-50/75 p-4 text-sm leading-6 text-sky-900">
        <div className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />講義音声はクラウドに送信しません</div>
        スマホの下書き文字起こしをWindowsで高精度化し、Obsidian用Markdownまでローカルで整理します。
      </div>

      <GlassButton className="mt-4 w-full" variant="primary">Windowsで高精度再文字起こし</GlassButton>
    </GlassCard>
  );
}
