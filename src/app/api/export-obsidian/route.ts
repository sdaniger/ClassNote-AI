import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type ExportRequest = {
  vaultPath: string;
  exportFolder: string;
  fileName: string;
  markdown: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportRequest;

    if (!body.vaultPath?.trim()) {
      return NextResponse.json({ ok: false, error: "Vault path が未設定です。" }, { status: 400 });
    }

    if (!body.markdown?.trim()) {
      return NextResponse.json({ ok: false, error: "書き出すMarkdownが空です。" }, { status: 400 });
    }

    const targetDir = path.resolve(/* turbopackIgnore: true */ body.vaultPath, body.exportFolder || ".");
    const targetPath = path.join(targetDir, body.fileName);
    await mkdir(targetDir, { recursive: true });
    await writeFile(targetPath, body.markdown, "utf8");

    return NextResponse.json({ ok: true, path: targetPath });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "ファイル書き出しに失敗しました。" }, { status: 500 });
  }
}
