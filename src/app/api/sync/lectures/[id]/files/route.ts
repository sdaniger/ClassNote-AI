import { NextResponse } from "next/server";
import { validatePairingToken } from "@/services/sync/pairingToken";
import { receiveLectureFiles } from "@/services/sync/receiveLecture";
import type { LectureFilePayload } from "@/services/sync/syncTypes";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json() as LectureFilePayload;
  if (!validatePairingToken(body.pairingToken)) {
    return NextResponse.json({ ok: false, error: "pairingToken が無効です。" }, { status: 401 });
  }

  await receiveLectureFiles(id, body);
  return NextResponse.json({ ok: true });
}
