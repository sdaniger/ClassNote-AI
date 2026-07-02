import * as FileSystem from "expo-file-system/legacy";
import type { Lecture, PairingPayload, SyncProgressStep, TranscriptSegment } from "@/types/lecture";

export type SyncLectureInput = {
  pairing: PairingPayload;
  lecture: Lecture;
  transcript: TranscriptSegment[];
  onProgress?: (step: SyncProgressStep, message: string) => void;
};

export function parsePairingPayload(raw: string): PairingPayload {
  const parsed = JSON.parse(raw) as Partial<PairingPayload>;
  if (!parsed.baseUrl || !parsed.pairingToken || !parsed.deviceName) throw new Error("QRコードが無効です。Windows版の同期画面でQRコードを再表示してください。");
  return parsed as PairingPayload;
}

export async function pairWithWindows(pairing: PairingPayload) {
  const response = await fetch(`${pairing.baseUrl}/api/sync/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairingToken: pairing.pairingToken, deviceName: "ClassNote Mobile" }),
  });
  const result = await response.json() as { ok: boolean; error?: string };
  if (!response.ok || !result.ok) throw new Error(result.error ?? "Windows版に接続できません。同じWi-Fiに接続されているか確認してください。");
}

export async function syncLectureToWindows({ pairing, lecture, transcript, onProgress }: SyncLectureInput) {
  onProgress?.("checking_connection", "接続確認中");
  await pairWithWindows(pairing);

  onProgress?.("sending_metadata", "講義メタデータを送信中");
  const metadataResponse = await fetch(`${pairing.baseUrl}/api/sync/lectures`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairingToken: pairing.pairingToken, lecture: { ...lecture, syncStatus: "syncing" } }),
  });
  const metadata = await metadataResponse.json() as { ok: boolean; error?: string };
  if (!metadataResponse.ok || !metadata.ok) throw new Error(metadata.error ?? "講義メタデータの送信に失敗しました。");

  onProgress?.("sending_audio", "音声ファイルを送信中");
  const audioBase64 = await FileSystem.readAsStringAsync(lecture.audioUri, { encoding: FileSystem.EncodingType.Base64 });

  onProgress?.("sending_transcript", "文字起こしを送信中");
  onProgress?.("sending_markers", "マーカーを送信中");
  const filesResponse = await fetch(`${pairing.baseUrl}/api/sync/lectures/${encodeURIComponent(lecture.id)}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pairingToken: pairing.pairingToken,
      audioBase64,
      audioFileName: lecture.audioFile,
      transcript,
      markers: lecture.markers,
    }),
  });
  const files = await filesResponse.json() as { ok: boolean; error?: string };
  if (!filesResponse.ok || !files.ok) throw new Error(files.error ?? "音声または文字起こしの送信に失敗しました。");

  onProgress?.("saving_on_windows", "Windows側で保存中");
  await delay(250);
  onProgress?.("completed", "同期完了");
}

export type WindowsUpdatePackage = {
  lecture: Lecture;
  transcript: TranscriptSegment[];
  markers?: Lecture["markers"];
  noteJson?: unknown;
  noteMarkdown?: string;
};

export async function fetchWindowsUpdate(pairing: PairingPayload, lecture: Lecture): Promise<{ conflict: boolean; update: WindowsUpdatePackage }> {
  const response = await fetch(`${pairing.baseUrl}/api/sync/lectures/${encodeURIComponent(lecture.id)}/updates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairingToken: pairing.pairingToken, mobileUpdatedAt: lecture.updatedAt, mobileLastSyncedAt: lecture.lastSyncedAt }),
  });
  const result = await response.json() as { ok: boolean; conflict: boolean; update: WindowsUpdatePackage; error?: string };
  if (!response.ok || !result.ok) throw new Error(result.error ?? "Windows側の更新取得に失敗しました。");
  return { conflict: result.conflict, update: result.update };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
