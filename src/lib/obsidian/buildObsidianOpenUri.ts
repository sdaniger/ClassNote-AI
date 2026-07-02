export function buildObsidianOpenUri(vaultName: string, filePath: string) {
  if (!vaultName.trim()) throw new Error("Vault名が未設定です。");
  if (!filePath.trim()) throw new Error("Obsidianで開くファイルパスが未設定です。");

  const params = new URLSearchParams({ vault: vaultName, file: filePath });
  return `obsidian://open?${params.toString()}`;
}

export function buildExportFileName(date: string, course: string, title: string) {
  return `${date}_${course}_${title}.md`.replace(/[\\/:*?"<>|]/g, "_");
}
