import { NextResponse } from "next/server";
import { validatePairingToken } from "@/services/sync/pairingToken";
import { getWindowsUpdatePackage } from "@/services/sync/receiveLecture";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json() as { pairingToken?: string; mobileUpdatedAt?: string; mobileLastSyncedAt?: string };
    if (!validatePairingToken(body.pairingToken)) return NextResponse.json({ ok: false, error: "pairingToken が無効です。" }, { status: 401 });

    const update = await getWindowsUpdatePackage(id);
    const windowsUpdatedAt = new Date(update.lecture.updatedAt).getTime();
    const mobileUpdatedAt = body.mobileUpdatedAt ? new Date(body.mobileUpdatedAt).getTime() : 0;
    const lastSyncedAt = body.mobileLastSyncedAt ? new Date(body.mobileLastSyncedAt).getTime() : 0;
    const conflict = mobileUpdatedAt > lastSyncedAt && windowsUpdatedAt > lastSyncedAt && Math.abs(mobileUpdatedAt - windowsUpdatedAt) > 1000;

    return NextResponse.json({ ok: true, conflict, update });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Windows側の更新取得に失敗しました。" }, { status: 500 });
  }
}
