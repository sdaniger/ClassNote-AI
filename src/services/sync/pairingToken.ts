import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data", "pairing");
const TOKEN_FILE = path.join(DATA_DIR, "token.json");

function loadOrCreateToken(): string {
  try {
    if (existsSync(TOKEN_FILE)) {
      const raw = readFileSync(TOKEN_FILE, "utf8");
      const parsed = JSON.parse(raw) as { token: string };
      if (parsed.token) return parsed.token;
    }
  } catch {}
  const token = randomBytes(24).toString("base64url");
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(TOKEN_FILE, JSON.stringify({ token, createdAt: new Date().toISOString() }), "utf8");
  } catch {}
  return token;
}

const token = loadOrCreateToken();

export function getPairingToken() {
  return token;
}

export function validatePairingToken(candidate: string | undefined) {
  return Boolean(candidate) && candidate === token;
}
