"use client";

import Link from "next/link";
import GamesMenu from "@/components/shared/GamesMenu";
import AccountMenu from "@/components/shared/AccountMenu";
import LocaleToggle from "@/components/shared/LocaleToggle";
import { useLocale } from "@/components/shared/LocaleProvider";

/** Top navigation shared by the landing page, the games hub and game pages. */
export default function SiteHeader() {
  const { t } = useLocale();
  return <header className="topbar">
    <Link className="brand" href="/"><span className="brand-mark">d</span><span>keyflow<span className="brand-dot">.</span></span></Link>
    <nav className="topnav" aria-label="Primary">
      <Link href="/">{t("nav.overview")}</Link>
      <Link href="/learn">{t("nav.learn")}</Link>
      <Link href="/library">{t("nav.library")}</Link>
      <Link href="/setup">{t("nav.practice")}</Link>
      <GamesMenu/>
      <Link href="/progress">{t("nav.progress")}</Link>
    </nav>
    <LocaleToggle/>
    <AccountMenu />
  </header>;
}
