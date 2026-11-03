"use client";

import SiteHeader from "@/components/shared/SiteHeader";
import { useLocale } from "@/components/shared/LocaleProvider";

export function SetupHeader() {
  return <SiteHeader />;
}

export function SetupHeading() {
  const { t } = useLocale();
  return <div className="mb-7 max-w-xl"><span className="text-[10px] font-bold tracking-[0.16em] text-[#617089]">{t("setup.kicker")}</span><h1 className="mt-3 font-serif text-4xl tracking-tight text-[#24262a] sm:text-5xl">{t("setup.title")}</h1><p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{t("setup.intro")}</p></div>;
}
