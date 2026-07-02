import { NextResponse } from "next/server";
import { validatePairingToken } from "@/services/sync/pairingToken";

export async function POST(request: Request) {
  const body = await request.json() as { pairingToken?: string; deviceName?: string };
  if (!validatePairingToken(body.pairingToken)) {
    return NextResponse.json({ ok: false, error: "pairingToken が無効です。Windows版の同期画面でQRコードを再表示してください。" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, pairedDevice: body.deviceName || "Mobile" });
}
