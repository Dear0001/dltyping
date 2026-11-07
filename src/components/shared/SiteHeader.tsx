"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GamesMenu from "@/components/shared/GamesMenu";
import AccountMenu from "@/components/shared/AccountMenu";
import LocaleToggle from "@/components/shared/LocaleToggle";
import ThemeSwitcher from "@/components/shared/ThemeSwitcher";
import Logo from "@/components/shared/Logo";
import { useLocale } from "@/components/shared/LocaleProvider";

/** Top navigation shared by the landing page, the games hub and game pages. */
export default function SiteHeader() {
  const { t } = useLocale();
  const pathname = usePathname();
  const links: [string, string][] = [["/", "nav.overview"], ["/learn", "nav.learn"], ["/library", "nav.library"], ["/setup", "nav.practice"]];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const ref = useRef<HTMLElement>(null);
  // The bar is position:fixed, so publish its real height (it wraps to two rows on phones) for the body offset.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => document.documentElement.style.setProperty("--topbar-h", `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <header className="topbar" ref={ref}>
    <Link className="brand" href="/" aria-label="DL Typing"><Logo/></Link>
    <nav className="topnav" aria-label="Primary">
      {links.map(([href, key]) => <Link key={href} href={href} className={isActive(href) ? "active" : undefined} aria-current={isActive(href) ? "page" : undefined}>{t(key)}</Link>)}
      <GamesMenu/>
      <Link href="/dashboard" className={isActive("/dashboard") ? "active" : undefined} aria-current={isActive("/dashboard") ? "page" : undefined}>{t("nav.dashboard")}</Link>
      <Link href="/progress" className={isActive("/progress") ? "active" : undefined} aria-current={isActive("/progress") ? "page" : undefined}>{t("nav.progress")}</Link>
    </nav>
    <ThemeSwitcher/>
    <LocaleToggle/>
    <AccountMenu />
  </header>;
}
