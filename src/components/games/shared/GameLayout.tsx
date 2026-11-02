"use client";

import SiteHeader from "@/components/shared/SiteHeader";
import { useSettings } from "@/hooks/use-stored-value";

/** Page chrome for every game. */
export default function GameLayout({ children }: { children: React.ReactNode }) {
  const [settings] = useSettings();
  return <div className="gm-page min-h-screen bg-surface text-navy" data-reduce-motion={settings.animations ? "false" : "true"}>
    <SiteHeader />
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
      {children}
    </main>
  </div>;
}
