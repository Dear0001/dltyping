"use client";

import Link from "next/link";
import LocaleToggle from "@/components/shared/LocaleToggle";
import { useLocale } from "@/components/shared/LocaleProvider";

export function SetupHeader() {
  const { t } = useLocale();
  return <header className="border-b border-[#e2e8f0] bg-white/70"><div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-5"><Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#2e415f] font-serif text-xl italic text-white">d</span><span>keyflow<span className="text-[#6682ae]">.</span></span></Link><div className="flex items-center gap-4"><Link href="/games" className="text-xs text-[#656b75] hover:text-[#2563eb]">{t("nav.games")}</Link><LocaleToggle/><Link href="/" className="text-xs text-[#64748b] hover:text-[#2563eb]">← {t("nav.back")}</Link></div></div></header>;
}

export function SetupHeading() {
  const { t } = useLocale();
  return <div className="mb-7 max-w-xl"><span className="text-[10px] font-bold tracking-[0.16em] text-[#617089]">{t("setup.kicker")}</span><h1 className="mt-3 font-serif text-4xl tracking-tight text-[#24262a] sm:text-5xl">{t("setup.title")}</h1><p className="mt-3 text-sm leading-6 text-[#64748b]">{t("setup.intro")}</p></div>;
}
