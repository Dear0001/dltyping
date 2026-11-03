import type { KeyboardOS } from "@/components/keyboard/layouts/types";
import type { OSPlatform } from "@/types";

type NavigatorWithUAData = Navigator & { userAgentData?: { platform?: string } };

/**
 * Best-effort OS detection that never throws. Order of trust:
 * 1. navigator.userAgentData.platform (modern Chromium, not spoofable by UA freezing)
 * 2. navigator.platform (legacy but still widely supported)
 * 3. user-agent string
 * iPadOS reports "MacIntel" with touch points; treat it as unknown (no hardware Mac keyboard assumed).
 */
export function detectKeyboardOS(): KeyboardOS | null {
  try {
    if (typeof navigator === "undefined") return null;
    const nav = navigator as NavigatorWithUAData;
    const hints = [nav.userAgentData?.platform, nav.platform, nav.userAgent].filter((v): v is string => typeof v === "string" && v.length > 0);
    const touchMac = /Mac/i.test(nav.platform ?? "") && (nav.maxTouchPoints ?? 0) > 1;
    for (const hint of hints) {
      if (/win/i.test(hint) && !/darwin/i.test(hint)) return "windows";
      if (/mac/i.test(hint) && !touchMac) return "mac";
    }
    return null;
  } catch {
    return null;
  }
}

/** Map the server-side OSPlatform hint onto a keyboard OS. */
export function osFromPlatform(platform?: OSPlatform): KeyboardOS | null {
  return platform === "macOS" ? "mac" : platform === "Windows" ? "windows" : null;
}
