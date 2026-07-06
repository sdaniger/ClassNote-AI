"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Laptop } from "lucide-react";
import { GlassButton } from "@/components/GlassButton";
import { GlassCard } from "@/components/GlassCard";
import { StatusPill } from "@/components/StatusPill";
import { SyncDeviceCard } from "@/components/SyncDeviceCard";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import type { Lecture } from "@/types/lecture";

export function SyncScreen({ onBack }: { onBack: () => void }) {
  const [serverInfo, setServerInfo] = useState<{ baseUrl: string; deviceName: string; pairing: unknown } | null>(null);
  const [receivedLectures, setReceivedLectures] = useState<Lecture[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  const startServer = async () => {
    setSyncError(null);
    try {
      const health = await fetch("/api/sync/health").then((res) => res.json()) as { ok: boolean; baseUrl: string; deviceName: string; pairing: unknown; error?: string };
      if (!health.ok) throw new Error(health.error ?? "同期サーバーを起動できませんでした。");
      setServerInfo({ baseUrl: health.baseUrl, deviceName: health.deviceName, pairing: health.pairing });
      const list = await fetch("/api/sync/lectures").then((res) => res.json()) as { lectures: Lecture[] };
      setReceivedLectures(list.lectures ?? []);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Windows同期サーバーに接続できません。");
    }
  };

  const refreshReceivedLectures = async () => {
    const list = await fetch("/api/sync/lectures").then((res) => res.json()) as { lectures: Lecture[] };
    setReceivedLectures(list.lectures ?? []);
  };

  const refineLecture = async (lectureId: string) => {
    setSyncError(null);
    try {
      const result = await fetch(`/api/sync/lectures/${encodeURIComponent(lectureId)}/refine`, { method: "POST" }).then((res) => res.json()) as { ok: boolean; error?: string };
      if (!result.ok) throw new Error(result.error ?? "高精度再文字起こしに失敗しました。");
      await refreshReceivedLectures();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Windowsでの高精度文字起こしに失敗しました。");
    }
  };

  const qrValue = serverInfo ? JSON.stringify(serverInfo.pairing) : "";

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow="Sync" title="Windowsと同期" description="スマホで録音、Windowsで高精度化。ローカルWi-Fiだけで安全に講義を移動します。" onBack={onBack} />
      <GlassCard className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Local Sync Server</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">Windows同期サーバー</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">講義音声はクラウドに送信されません。同じWi-Fi内のWindows版にだけ転送されます。</p>
          </div>
          <StatusPill tone={serverInfo ? "green" : "slate"}>{serverInfo ? "起動中" : "停止中"}</StatusPill>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <GlassButton onClick={startServer} variant="primary">サーバー起動</GlassButton>
          <GlassButton onClick={() => setServerInfo(null)}>停止</GlassButton>
        </div>
        {syncError ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{syncError}</p> : null}
      </GlassCard>

      {serverInfo ? (
        <GlassCard solid className="p-5 text-center">
          <h3 className="text-lg font-bold text-slate-950">スマホでQRコードを読み取る</h3>
          <div className="mx-auto mt-4 grid h-56 w-56 place-items-center rounded-[30px] bg-white shadow-inner">
            <QRCodeSVG value={qrValue} size={178} bgColor="#ffffff" fgColor="#0f172a" />
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500">{serverInfo.baseUrl}</p>
          <StatusPill tone="green">{serverInfo.deviceName}</StatusPill>
        </GlassCard>
      ) : <SyncDeviceCard />}

      <GlassCard solid className="p-5">
        <h3 className="text-lg font-bold">受信済み講義</h3>
        <div className="mt-3 space-y-2">
          {receivedLectures.length === 0 ? <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">まだ受信した講義はありません。</p> : receivedLectures.map((lecture) => (
            <div key={lecture.id} className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-900">{lecture.title}</span><StatusPill tone="green">受信済み</StatusPill></div>
              <p className="mt-1 text-xs text-slate-500">{lecture.course} ・ {lecture.audioFile}</p>
              {lecture.transcriptionStatus === "mobile_draft" ? <GlassButton onClick={() => refineLecture(lecture.id)} className="mt-3 w-full"><Laptop className="h-4 w-4" />Windowsで高精度再文字起こし</GlassButton> : null}
              {lecture.transcriptionStatus === "desktop_final" ? <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">スマホへ返す高精度版があります</p> : null}
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard solid className="p-5">
        <h3 className="text-lg font-bold">スマホへ返す更新</h3>
        <div className="mt-3 space-y-2">
          {receivedLectures.filter((lecture) => lecture.syncStatus === "update_available" || lecture.transcriptionStatus === "desktop_final").length === 0 ? <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">返送できる更新はありません。</p> : receivedLectures.filter((lecture) => lecture.syncStatus === "update_available" || lecture.transcriptionStatus === "desktop_final").map((lecture) => <p key={lecture.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-sm font-semibold"><span>{lecture.title}</span><StatusPill tone="green">desktop_final</StatusPill></p>)}
        </div>
      </GlassCard>
      <GlassCard solid className="p-5">
        <h3 className="text-lg font-bold">競合中</h3>
        <div className="mt-3 space-y-2">
          {receivedLectures.filter((lecture) => lecture.syncStatus === "conflict").length === 0 ? <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">競合はありません。</p> : receivedLectures.filter((lecture) => lecture.syncStatus === "conflict").map((lecture) => <p key={lecture.id} className="rounded-2xl bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-800">{lecture.title}: どちらを最新版にするか選択が必要です。</p>)}
        </div>
      </GlassCard>
    </div>
  );
}
