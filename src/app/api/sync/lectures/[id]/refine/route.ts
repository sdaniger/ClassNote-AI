import { NextResponse } from "next/server";
import { refineLectureOnWindows } from "@/services/sync/receiveLecture";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const lecture = await refineLectureOnWindows(id);
    return NextResponse.json({ ok: true, lecture });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Windowsでの高精度文字起こしに失敗しました。音声ファイルが存在するか確認してください。" }, { status: 500 });
  }
}
