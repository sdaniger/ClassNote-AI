import { NextResponse } from "next/server";
import { validatePairingToken } from "@/services/sync/pairingToken";
import { listReceivedLectures, receiveLectureMetadata } from "@/services/sync/receiveLecture";
import type { SyncedLecture } from "@/services/sync/syncTypes";

export async function GET() {
  return NextResponse.json({ ok: true, lectures: await listReceivedLectures() });
}

export async function POST(request: Request) {
  const body = await request.json() as { pairingToken?: string; lecture?: SyncedLecture };
  if (!validatePairingToken(body.pairingToken)) {
    return NextResponse.json({ ok: false, error: "pairingToken が無効です。" }, { status: 401 });
  }
  if (!body.lecture?.id) {
    return NextResponse.json({ ok: false, error: "lecture.json が不正です。" }, { status: 400 });
  }

  const lecture = await receiveLectureMetadata(body.lecture);
  return NextResponse.json({ ok: true, lecture });
}
