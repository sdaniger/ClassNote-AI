import os from "node:os";
import { NextResponse } from "next/server";
import { getPairingToken } from "@/services/sync/pairingToken";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hostHeader = request.headers.get("host") || `${url.hostname}:${url.port || "3000"}`;
  const [host, portRaw] = hostHeader.split(":");
  const port = Number(portRaw || url.port || 3000);

  return NextResponse.json({
    ok: true,
    deviceName: os.hostname() || "Windows PC",
    baseUrl: `${url.protocol}//${hostHeader}`,
    pairing: {
      host,
      port,
      pairingToken: getPairingToken(),
      deviceName: os.hostname() || "Windows PC",
      baseUrl: `${url.protocol}//${hostHeader}`,
    },
  });
}
