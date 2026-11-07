"use client";

import type { ReactNode } from "react";
import { useHydrated } from "@/hooks/useTypingProgress";

/**
 * Shows `fallback` (a skeleton) until the browser has read this device's saved data,
 * so users never see a blank or zeroed-out component before their real numbers arrive.
 * Server and first client render agree, so there is no hydration mismatch.
 */
export default function Ready({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return useHydrated() ? <>{children}</> : <>{fallback}</>;
}
