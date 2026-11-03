"use client";

import Link from "next/link";
import Logo from "@/components/shared/Logo";
import LocaleToggle from "@/components/shared/LocaleToggle";
import ThemeSwitcher from "@/components/shared/ThemeSwitcher";
import { useLocale } from "@/components/shared/LocaleProvider";

export function SetupHeader() {
  const { t } = useLocale();
  return <header className="border-b border-[color:var(--line)] bg-surface"><div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-5"><Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight"><Logo/></Link><div className="flex items-center gap-4"><Link href="/games" className="text-xs text-[#656b75] hover:text-[color:var(--green)]">{t("nav.games")}</Link><ThemeSwitcher/><LocaleToggle/><Link href="/" className="text-xs text-[color:var(--muted)] hover:text-[color:var(--green)]">← {t("nav.back")}</Link></div></div></header>;
}

export function SetupHeading() {
  const { t } = useLocale();
  return <div className="mb-7 max-w-xl"><span className="text-[10px] font-bold tracking-[0.16em] text-[#617089]">{t("setup.kicker")}</span><h1 className="mt-3 font-serif text-4xl tracking-tight text-[#24262a] sm:text-5xl">{t("setup.title")}</h1><p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{t("setup.intro")}</p></div>;
}
