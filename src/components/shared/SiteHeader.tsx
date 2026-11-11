"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GamesMenu from "@/components/shared/GamesMenu";
import AccountMenu from "@/components/shared/AccountMenu";
import LocaleToggle from "@/components/shared/LocaleToggle";
import ThemeSwitcher from "@/components/shared/ThemeSwitcher";
import Logo from "@/components/shared/Logo";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useAccount } from "@/lib/account";

// Single source of truth for the primary navigation. "games" is rendered by GamesMenu on desktop.
const NAV: { href: string; key: string }[] = [
  { href: "/", key: "nav.overview" }, { href: "/learn", key: "nav.learn" }, { href: "/library", key: "nav.library" },
  { href: "/setup", key: "nav.practice" }, { href: "/test", key: "nav.test" }, { href: "/daily", key: "nav.daily" },
  { href: "/games", key: "nav.games" }, { href: "/dashboard", key: "nav.dashboard" }, { href: "/progress", key: "nav.progress" },
];

/** Top navigation shared by the landing page, the games hub and game pages. */
export default function SiteHeader() {
  const { t } = useLocale();
  const account = useAccount();
  // Signed-in users find Dashboard and Progress in the profile dropdown instead.
  const items = account.status === "user" ? NAV.filter((n) => n.href !== "/dashboard" && n.href !== "/progress") : NAV;
  const pathname = usePathname();
  const [menu, setMenu] = useState<{ open: boolean; path: string }>({ open: false, path: pathname });
  const open = menu.open && menu.path === pathname; // navigating closes the drawer
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const ref = useRef<HTMLElement>(null);
  // The bar is position:fixed, so publish its real height for the body offset.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => document.documentElement.style.setProperty("--topbar-h", `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu({ open: false, path: pathname }); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pathname]);
  const link = (href: string, key: string) => <Link key={href} href={href} className={isActive(href) ? "active" : undefined} aria-current={isActive(href) ? "page" : undefined}>{t(key)}</Link>;
  return <header className="topbar" ref={ref} data-open={open || undefined}>
    <Link className="brand" href="/" aria-label="DL Typing"><Logo height={30}/></Link>
    <nav className="topnav" aria-label={t("nav.primary")}>
      {items.map(({ href, key }) => href === "/games" ? <GamesMenu key={href}/> : link(href, key))}
    </nav>
    <div className="tb-tools"><ThemeSwitcher/><LocaleToggle/></div>
    <AccountMenu />
    <button type="button" className="tb-burger" aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")} aria-expanded={open} aria-controls="tb-drawer" onClick={() => setMenu({ open: !open, path: pathname })}><span/><span/><span/></button>
    <div className="tb-drawer" id="tb-drawer">
      <nav aria-label={t("nav.mobile")}>{items.map(({ href, key }) => link(href, key))}</nav>
      <div className="tb-drawer-tools"><ThemeSwitcher/><LocaleToggle/></div>
    </div>
  </header>;
}
