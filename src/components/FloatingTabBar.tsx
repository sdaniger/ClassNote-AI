import { BookOpen, GraduationCap, Home, MessageCircle, Search, Settings, Wifi } from "lucide-react";
import type { AppScreen, BottomNavItem } from "@/types/lecture";

const items: BottomNavItem[] = [
  { id: "home", label: "ホーム", icon: Home },
  { id: "search", label: "検索", icon: Search },
  { id: "globalChat", label: "相談", icon: MessageCircle },
  { id: "studyHome", label: "学習", icon: GraduationCap },
  { id: "detail", label: "講義", icon: BookOpen },
  { id: "sync", label: "同期", icon: Wifi },
  { id: "settings", label: "設定", icon: Settings },
];

export function FloatingTabBar({ active, onChange }: { active: AppScreen; onChange: (screen: AppScreen) => void }) {
  return (
    <nav className="pointer-events-auto absolute inset-x-4 bottom-4 z-20 rounded-full border border-white/70 bg-white/62 p-1.5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-3xl" role="tablist" aria-label="メインナビゲーション">
      <div className="grid grid-cols-7 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-bold transition-all duration-300 active:scale-95 ${isActive ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.25)]" : "text-slate-500 hover:bg-white/60"}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
