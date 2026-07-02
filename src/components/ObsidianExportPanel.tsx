"use client";

import { useMemo, useState } from "react";
import { Check, Download, ExternalLink, FolderOpen, RefreshCw } from "lucide-react";
import type { Lecture, LectureMarker, LectureNote, ObsidianSettings, TranscriptSegment } from "@/types/lecture";
import { buildLectureMarkdown } from "@/lib/markdown/buildLectureMarkdown";
import { buildExportFileName, buildObsidianOpenUri } from "@/lib/obsidian/buildObsidianOpenUri";
import { GlassButton } from "./GlassButton";
import { GlassCard } from "./GlassCard";

type ObsidianExportPanelProps = {
  lecture: Lecture;
  note?: LectureNote;
  markdown?: string;
  settings: ObsidianSettings;
  transcript: TranscriptSegment[];
  markers: LectureMarker[];
  onGenerateNote: () => void;
  onExportSuccess?: () => void;
};

const optionLabels = [
  ["要約", true],
  ["重要ポイント", true],
  ["タイムライン", true],
  ["復習問題", "exportQuiz"],
  ["文字起こし全文", "exportTranscriptFullText"],
  ["マーカー", "exportMarkers"],
] as const;

export function ObsidianExportPanel({ lecture, note, markdown, settings, transcript, markers, onGenerateNote, onExportSuccess }: ObsidianExportPanelProps) {
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const fileName = buildExportFileName(lecture.recordedAt.slice(0, 10), lecture.course, lecture.title);
  const filePath = `${settings.exportFolder}/${fileName}`.replace(/\/+/g, "/");
  const previewMarkdown = useMemo(() => {
    if (!note) return "自動メモを生成すると、ここにObsidian用Markdownプレビューが表示されます。";
    return markdown ?? buildLectureMarkdown(lecture, note, transcript, markers, settings);
  }, [lecture, markers, markdown, note, settings, transcript]);

  const openUri = useMemo(() => {
    try {
      return buildObsidianOpenUri(settings.vaultName, filePath.replace(/\.md$/, ""));
    } catch {
      return "";
    }
  }, [filePath, settings.vaultName]);

  const handleExport = async () => {
    setExportStatus(null);
    setExportError(null);

    if (!note) {
      setExportError("先に自動メモを生成してください。");
      return;
    }

    if (!settings.vaultPath.trim()) {
      setExportError("Vault path が未設定です。Settingsで保存先を設定するか、Markdownをダウンロードしてください。");
      return;
    }

    try {
      const response = await fetch("/api/export-obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultPath: settings.vaultPath, exportFolder: settings.exportFolder, fileName, markdown: previewMarkdown }),
      });
      const result = (await response.json()) as { ok: boolean; path?: string; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error ?? "ファイル書き出しに失敗しました。");
      setExportStatus(`書き出し完了: ${result.path}`);
      onExportSuccess?.();
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Obsidianへの書き出しに失敗しました。");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([previewMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">Obsidian Vault</p>
            <h3 className="truncate text-lg font-bold text-slate-900">{settings.vaultName || "Vault未設定"}</h3>
            <p className="truncate text-xs text-slate-500">{settings.vaultPath || "SettingsでVault pathを設定"}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 rounded-[22px] bg-white/58 p-3 text-xs font-semibold text-slate-600 shadow-inner">
          <p>保存先: {settings.exportFolder}</p>
          <p>出力ファイル: {fileName}</p>
        </div>
      </GlassCard>

      <GlassCard solid className="p-5">
        <h3 className="text-base font-bold text-slate-900">出力項目</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {optionLabels.map(([option, key]) => {
            const enabled = key === true ? true : settings[key];
            return (
              <div key={option} className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold ${enabled ? "bg-slate-50 text-slate-700" : "bg-slate-100/60 text-slate-400"}`}>
                <span className={`grid h-5 w-5 place-items-center rounded-full text-white ${enabled ? "bg-emerald-500" : "bg-slate-300"}`}><Check className="h-3 w-3" /></span>
                {option}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {!note ? (
        <GlassCard className="p-5 text-center">
          <h3 className="text-lg font-bold text-slate-900">Markdown生成前です</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Obsidianに書き出すには、まず文字起こしから自動メモを生成してください。</p>
          <GlassButton onClick={onGenerateNote} variant="primary" className="mt-4 w-full"><RefreshCw className="h-4 w-4" />自動メモを生成</GlassButton>
        </GlassCard>
      ) : null}

      <GlassCard solid className="overflow-hidden p-0">
        <div className="border-b border-slate-200/80 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">Markdown Preview</h3>
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap bg-slate-950 px-5 py-4 text-[12px] leading-6 text-slate-100"><code>{previewMarkdown}</code></pre>
      </GlassCard>

      {exportStatus ? <p className="rounded-[22px] bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-700">{exportStatus}</p> : null}
      {exportError ? <p className="rounded-[22px] bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">{exportError}</p> : null}

      <div className="grid gap-3">
        <GlassButton onClick={handleExport} variant="primary">Obsidianに書き出す</GlassButton>
        <div className="grid grid-cols-2 gap-3">
          <GlassButton onClick={handleDownload}><Download className="h-4 w-4" />Download</GlassButton>
          <GlassButton onClick={() => openUri ? window.location.assign(openUri) : setExportError("Obsidian URI生成に失敗しました。Vault名と保存先を確認してください。")}><ExternalLink className="h-4 w-4" />Obsidianで開く</GlassButton>
        </div>
      </div>
    </div>
  );
}
