import { copyFile, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export async function writeJsonWithBackup(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const backupPath = filePath.replace(/\.json$/, ".backup.json");
  const tempPath = `${filePath}.tmp`;
  try { await copyFile(filePath, backupPath); } catch {}
  await writeFile(tempPath, JSON.stringify(value, null, 2), "utf8");
  await rename(tempPath, filePath);
}
