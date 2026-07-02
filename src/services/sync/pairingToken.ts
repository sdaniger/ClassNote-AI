import { randomBytes } from "node:crypto";

const token = randomBytes(24).toString("base64url");

export function getPairingToken() {
  return token;
}

export function validatePairingToken(candidate: string | undefined) {
  return Boolean(candidate) && candidate === token;
}
