"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { GlassButton } from "@/components/GlassButton";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { MetaItem } from "@/components/common/MetaItem";
import { SettingsSection } from "@/components/SettingsSection";
import { audioModeOptions } from "@/lib/lectureStore";
import { providerDefaults } from "@/lib/llm/llmSettings";
import { copyableLogs } from "@/services/logger/logger";
import type { AppLog, Job } from "@/services/jobs/jobTypes";
import type { AudioMode, Lecture, LlmProvider, LlmSettings, ObsidianSettings } from "@/types/lecture";

function SettingRow({ title, desc, active = false, onClick }: { title: string; desc: string; active?: boolean; onClick?: () => void }) {
  const Element = onClick ? "button" : "div";
  return <Element onClick={onClick} className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-all active:scale-[0.99] ${active ? "bg-sky-50 ring-1 ring-sky-200" : "bg-slate-50 hover:bg-white"}`}><div><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-0.5 text-xs text-slate-500">{desc}</p></div>{active ? <Check className="h-5 w-5 text-sky-600" /> : null}</Element>;
}

function SettingInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block rounded-2xl bg-slate-50 px-3 py-3">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <input className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function SettingToggle({ label, checked = true, onChange }: { label: string; checked?: boolean; onChange?: () => void }) {
  return <button onClick={onChange} role="switch" aria-checked={checked} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-left transition-all active:scale-[0.99]"><span className="text-sm font-bold text-slate-800">{label}</span><span className={`relative h-7 w-12 rounded-full shadow-inner transition-colors ${checked ? "bg-sky-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "right-1" : "left-1"}`} /></span></button>;
}

function DiagnosticsSection({ jobs, logs, lectureCount, vaultPath, onAddJob, onCancelJob, onRefresh }: { jobs: Job[]; logs: AppLog[]; lectureCount: number; vaultPath: string; onAddJob: (type: Job["type"], message: string) => void; onCancelJob: (jobId: string) => void; onRefresh: () => void }) {
  const running = jobs.filter((job) => job.status === "running" || job.status === "queued");
  return (
    <SettingsSection title="開発者向け診断" description="環境と処理状態を、学生にもわかる言葉で確認します。">
      <div className="grid grid-cols-2 gap-2">
        <MetaItem label="Version" value="0.1.0" />
        <MetaItem label="講義数" value={`${lectureCount}`} />
        <MetaItem label="ffmpeg" value="未検出(mock)" />
        <MetaItem label="Python" value="未検出(mock)" />
        <MetaItem label="faster-whisper" value="未検出(mock)" />
        <MetaItem label="GPU" value="auto予定" />
      </div>
      <SettingRow title="Obsidian Vault" desc={vaultPath || "未設定"} />
      <div className="grid grid-cols-2 gap-2">
        <GlassButton onClick={() => { onAddJob("transcribe", "環境チェックを実行中"); onRefresh(); }}>環境チェック</GlassButton>
        <GlassButton onClick={() => onAddJob("compress_audio", "テスト用音声処理")}>テスト音声処理</GlassButton>
        <GlassButton onClick={() => onAddJob("sync", "壊れたデータを検査")}>壊れたデータを検査</GlassButton>
        <GlassButton onClick={onRefresh}>更新</GlassButton>
      </div>
      <div className="space-y-2">
        {running.length === 0 ? <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">実行中の処理はありません。</p> : running.map((job) => <div key={job.id} className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-800">{job.message ?? job.type}</p><button onClick={() => onCancelJob(job.id)} className="text-xs font-bold text-rose-600">キャンセル</button></div><div className="mt-2 h-2 rounded-full bg-white"><div className="h-full rounded-full bg-sky-400" style={{ width: `${job.progress ?? 8}%` }} /></div></div>)}
      </div>
      <p className="text-xs leading-5 text-slate-500">ログ件数: {logs.length} / 保存先: localStorage + data/lectures</p>
    </SettingsSection>
  );
}

export function SettingsScreen({ audioMode, obsidianSettings, llmSettings, jobs, logs, lectures, onAudioModeChange, onObsidianSettingsChange, onLlmSettingsChange, onAddJob, onCancelJob, onRefreshDiagnostics, onBack, darkMode, onDarkModeChange }: {
  audioMode: AudioMode;
  obsidianSettings: ObsidianSettings;
  llmSettings: LlmSettings;
  jobs: Job[];
  logs: AppLog[];
  lectures: Lecture[];
  onAudioModeChange: (audioMode: AudioMode) => void;
  onObsidianSettingsChange: (settings: ObsidianSettings) => void;
  onLlmSettingsChange: (settings: LlmSettings) => void;
  onAddJob: (type: Job["type"], message: string) => void;
  onCancelJob: (jobId: string) => void;
  onRefreshDiagnostics: () => void;
  onBack: () => void;
  darkMode?: boolean;
  onDarkModeChange?: () => void;
}) {
  const updateObsidianSettings = (patch: Partial<ObsidianSettings>) => onObsidianSettingsChange({ ...obsidianSettings, ...patch });
  const [mobileSettings, setMobileSettings] = useState<Record<string, boolean>>({
    "録音後に文字起こし": true,
    "充電中のみ高負荷処理": true,
    "スマホ文字起こしは下書き扱い": true,
    "Windows同期後に高精度化": true,
  });

  return (
    <div className="space-y-5">
      <ScreenHeader eyebrow="Settings" title="学習環境の設定" description="録音、文字起こし、同期、復習、診断をカテゴリごとに整理しました。" onBack={onBack} />
      <SettingsSection title="録音" description="講義中に安心して使うための録音体験を調整します。">
        <SettingRow title="録音品質" desc="講義向け / mono / 安定優先" active />
        <SettingRow title="バックグラウンド録音" desc="モバイルdev buildで対応予定" />
        <SettingRow title="録音中スリープ防止" desc="講義中に画面が消えにくくする予定" />
        <SettingRow title="マーカーボタン表示" desc="わからない / 重要 / 課題" active />
      </SettingsSection>
      <SettingsSection title="音声保存モード" description="標準は90分で約11MB。講義録音に十分な聞き返し品質です。">
        {audioModeOptions.map((option) => (
          <SettingRow
            key={option.id}
            title={option.title}
            desc={`${option.description} ・ 90分で約${option.estimated90MinMb}MB`}
            active={option.id === audioMode}
            onClick={() => onAudioModeChange(option.id)}
          />
        ))}
        <SettingRow title="文字起こし用一時WAVを削除" desc="処理完了後に削除する" active />
        <SettingRow title="元音声を保持" desc="同期と再処理に備えて保持する" active />
      </SettingsSection>
      <SettingsSection title="文字起こし">
        {[["Windows", "faster-whisper"], ["Mobile", "whisper.cpp"], ["VAD", "on"], ["batch size", "16"], ["GPU", "auto"]].map(([title, desc]) => <SettingRow key={title} title={title} desc={desc} />)}
        <SettingRow title="CPU fallback" desc="GPUが使えない場合にCPUで処理" active />
        <SettingRow title="高精度再文字起こし" desc="Windows同期後にdesktop_finalを生成" active />
      </SettingsSection>
      <SettingsSection title="Mobile processing">
        {Object.entries(mobileSettings).map(([label, checked]) => <SettingToggle key={label} label={label} checked={checked} onChange={() => setMobileSettings((prev) => ({ ...prev, [label]: !prev[label] }))} />)}
      </SettingsSection>
      <SettingsSection title="テーマ" description="画面の表示モードを切り替えます。">
        <SettingToggle label="ダークモード" checked={darkMode ?? false} onChange={onDarkModeChange} />
      </SettingsSection>
      <SettingsSection title="ライブ要約" description="録音中にリアルタイム要約を表示（近日対応予定）">
        <SettingRow title="ライブ要約ON/OFF" desc="録音中に少し遅れて要約を表示" active />
        <SettingRow title="更新間隔" desc="30秒ごと" active />
        <SettingRow title="対象範囲" desc="直近90秒" active />
        <SettingRow title="表示内容" desc="要約 / やさしい説明 / 重要語句 / 試験 / 課題" active />
      </SettingsSection>
      <SettingsSection title="LLM / AI" description="AI回答の生成に使うバックエンドを選択します。">
        <SettingRow title="回答根拠" desc="文字起こし・要約・マーカーを優先" active />
        <div className="space-y-2">
          {([
            ["mock", "モック（ダミー応答）"],
            ["openai", "OpenAI"],
            ["groq", "Groq（無料枠あり）"],
            ["gemini", "Gemini（無料枠あり）"],
            ["openrouter", "OpenRouter（無料枠あり）"],
            ["ollama", "Ollama（ローカル）"],
            ["local", "Local（互換API）"],
          ] as const).map(([value, label]) => (
            <SettingRow key={value} title={label} desc="" active={llmSettings.provider === value} onClick={() => {
              const defaults = value !== "mock" ? providerDefaults[value as Exclude<LlmProvider, "mock">] : null;
              onLlmSettingsChange({ ...llmSettings, provider: value as LlmProvider, endpoint: defaults?.endpoint ?? llmSettings.endpoint, model: defaults?.model ?? llmSettings.model });
            }} />
          ))}
        </div>
        {llmSettings.provider !== "mock" ? <>
          <SettingInput label="API Key" value={llmSettings.apiKey} onChange={(value) => onLlmSettingsChange({ ...llmSettings, apiKey: value })} placeholder={llmSettings.provider === "ollama" || llmSettings.provider === "local" ? "不要（空欄でOK）" : "sk-..."} />
          <SettingInput label="Endpoint" value={llmSettings.endpoint} onChange={(value) => onLlmSettingsChange({ ...llmSettings, endpoint: value })} placeholder={llmSettings.provider === "ollama" ? "http://localhost:11434/v1" : llmSettings.provider === "gemini" ? "https://generativelanguage.googleapis.com" : "https://api.openai.com/v1"} />
          <SettingInput label="Model" value={llmSettings.model} onChange={(value) => onLlmSettingsChange({ ...llmSettings, model: value })} placeholder={llmSettings.provider === "openai" || llmSettings.provider === "openrouter" ? "gpt-4o-mini" : llmSettings.provider === "groq" ? "llama-3.3-70b-versatile" : llmSettings.provider === "gemini" ? "gemini-2.0-flash" : "llama3"} />
        </> : null}
      </SettingsSection>
      <SettingsSection title="Obsidian設定">
        <SettingInput label="Vault name" value={obsidianSettings.vaultName} onChange={(value) => updateObsidianSettings({ vaultName: value })} placeholder="大学ノート" />
        <SettingInput label="Vault path" value={obsidianSettings.vaultPath} onChange={(value) => updateObsidianSettings({ vaultPath: value })} placeholder="C:\\Users\\user\\Documents\\ObsidianVault" />
        <SettingInput label="Default export folder" value={obsidianSettings.exportFolder} onChange={(value) => updateObsidianSettings({ exportFolder: value })} placeholder="University/Lectures" />
        <SettingInput label="Markdown template" value={obsidianSettings.markdownTemplate} onChange={(value) => updateObsidianSettings({ markdownTemplate: value })} placeholder="lecture-template.md" />
        <SettingToggle label="Export transcript full text" checked={obsidianSettings.exportTranscriptFullText} onChange={() => updateObsidianSettings({ exportTranscriptFullText: !obsidianSettings.exportTranscriptFullText })} />
        <SettingToggle label="Export quiz" checked={obsidianSettings.exportQuiz} onChange={() => updateObsidianSettings({ exportQuiz: !obsidianSettings.exportQuiz })} />
        <SettingToggle label="Export markers" checked={obsidianSettings.exportMarkers} onChange={() => updateObsidianSettings({ exportMarkers: !obsidianSettings.exportMarkers })} />
        <SettingRow title="Obsidian URI生成" desc="Vault名とfile pathから生成" active />
        <SettingRow title="書き出しテスト" desc="Vault path設定後に確認" />
      </SettingsSection>
      <SettingsSection title="同期設定">
        <SettingRow title="Local Wi-Fi" desc="同じネットワーク内のみ" />
        <SettingRow title="Privacy" desc="クラウド送信なし" />
        <SettingRow title="QRペアリング" desc="起動ごとに変わるpairingTokenを使用" active />
        <SettingRow title="自動同期" desc="未実装。手動同期を推奨" />
        <SettingRow title="desktop_finalをスマホへ戻す" desc="Windows高精度版を反映" active />
        <SettingRow title="競合解決ルール" desc="Windows版 / スマホ版 / 手動選択" />
      </SettingsSection>
      <SettingsSection title="復習">
        <SettingRow title="復習カード" desc="自動メモとマーカーから生成" active />
        <SettingRow title="小テスト" desc="重要語句と試験ポイントから生成" active />
        <SettingRow title="リマインダー" desc="実通知は今後対応" />
      </SettingsSection>
      <SettingsSection title="ストレージ">
        <SettingRow title="講義数" desc={`${lectures.length}件`} />
        <SettingRow title="バックアップ保存" desc="重要JSONはbackupを作成" active />
        <SettingRow title="一時ファイル" desc="診断画面から削除予定" />
        <SettingRow title="壊れたデータを検査" desc="診断画面から実行" />
      </SettingsSection>
      <DiagnosticsSection jobs={jobs} logs={logs} lectureCount={lectures.length} vaultPath={obsidianSettings.vaultPath} onAddJob={onAddJob} onCancelJob={onCancelJob} onRefresh={onRefreshDiagnostics} />
      <SettingsSection title="開発者向け診断ログ">
        <GlassButton onClick={() => navigator.clipboard?.writeText(copyableLogs())}>ログをコピー</GlassButton>
        <div className="max-h-52 space-y-2 overflow-auto rounded-2xl bg-slate-50 p-3">
          {logs.length === 0 ? <p className="text-sm text-slate-500">ログはまだありません。</p> : logs.slice(0, 12).map((log) => <p key={log.id} className="text-xs leading-5 text-slate-600">[{log.level}] {log.area}: {log.message}</p>)}
        </div>
      </SettingsSection>
    </div>
  );
}
