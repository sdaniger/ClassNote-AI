import { Mic } from "lucide-react";

type RecordingOrbStatus = "idle" | "recording" | "paused";

const statusConfig: Record<RecordingOrbStatus, { label: string; color: string; pulse: string }> = {
  idle: { label: "REC", color: "from-rose-400 via-red-500 to-orange-400", pulse: "bg-rose-400/25" },
  recording: { label: "REC", color: "from-rose-500 via-red-600 to-orange-500", pulse: "bg-rose-500/35" },
  paused: { label: "PAUSE", color: "from-amber-400 via-amber-500 to-yellow-400", pulse: "bg-amber-400/25" },
};

export function RecordingOrb({ status = "idle" }: { status?: RecordingOrbStatus }) {
  const config = statusConfig[status];
  const animate = status === "recording" ? "softPulse 2.2s ease-in-out infinite" : status === "paused" ? "none" : "softPulse 3s ease-in-out infinite";

  return (
    <div className="relative grid h-44 w-44 place-items-center">
      <div className={`absolute inset-0 rounded-full ${config.pulse} blur-2xl`} />
      <div className="absolute inset-4 rounded-full border border-rose-200/60 bg-rose-300/20" style={{ animation: animate }} />
      <div className={`relative grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br ${config.color} shadow-[0_24px_70px_rgba(244,63,94,0.42)] ring-8 ring-white/45`}>
        <div className="absolute left-7 top-5 h-8 w-14 rounded-full bg-white/35 blur-sm" />
        <div className="flex flex-col items-center gap-2 text-white">
          <Mic className="h-9 w-9" />
          <span className="text-xs font-black tracking-[0.24em]">{config.label}</span>
        </div>
      </div>
    </div>
  );
}
