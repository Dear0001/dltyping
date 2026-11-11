"use client";

import Link from "next/link";
import { useEffect } from "react";
import { primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import { useLocale } from "@/components/shared/LocaleProvider";

/** Shown when a game crashes, so one broken game never takes the rest of the site down. */
export default function GameError({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useLocale();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <main className="mx-auto max-w-lg px-4 py-16 text-center">
    <div className="text-5xl" aria-hidden="true">🛠️</div>
    <h1 className="mt-3 text-2xl font-extrabold text-navy">{t("arc.crashTitle")}</h1>
    <p className="mt-2 text-sm text-mute">{t("arc.crashText")}</p>
    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
      <button type="button" className={primaryBtn} onClick={() => retry()}>{t("arc.crashRetry")}</button>
      <Link href="/games" className={secondaryBtn}>{t("gm.allGames")}</Link>
    </div>
  </main>;
}
