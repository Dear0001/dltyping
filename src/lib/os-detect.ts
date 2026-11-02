import { headers } from "next/headers";
import type { OSPlatform } from "@/types";

export function detectOSPlatform(userAgent: string): OSPlatform {
  if (/Windows NT|Windows Phone|Win32|Win64/i.test(userAgent)) return "Windows";
  if (/Macintosh|Mac OS X|Mac_PowerPC/i.test(userAgent)) return "macOS";
  return "Unknown";
}

export async function getOSPlatform(): Promise<OSPlatform> {
  const requestHeaders = await headers();
  return detectOSPlatform(requestHeaders.get("user-agent") ?? "");
}
