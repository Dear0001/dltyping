"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";
import { btn } from "@/components/ui/ui";

/**
 * Error state for the progress pages. Saved progress lives in this browser and is not
 * touched here: retrying re-renders the page, and the reset link is only a last resort.
 */
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useLocale();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <main className="mx-auto max-w-lg px-4 py-16 text-center">
    <div className="text-5xl" aria-hidden="true">📉</div>
    <h1 className="mt-3 text-2xl font-extrabold text-navy">{t("dash.errorTitle")}</h1>
    <p className="mt-2 text-sm text-mute">{t("dash.errorText")}</p>
    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
      <button type="button" className={btn("primary")} onClick={() => retry()}>{t("dash.errorRetry")}</button>
      <Link href="/setup" className={btn("secondary")}>{t("dash.errorPractice")}</Link>
    </div>
  </main>;
}
