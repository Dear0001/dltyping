"use client";

import { Suspense, useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GamesMenu from "@/components/shared/GamesMenu";
import AccountMenu from "@/components/shared/AccountMenu";
import LocaleToggle from "@/components/shared/LocaleToggle";
import ThemeSwitcher from "@/components/shared/ThemeSwitcher";
import Logo from "@/components/shared/Logo";
import BiText from "@/components/shared/BiText";
import { useLocale } from "@/components/shared/LocaleProvider";

// Single source of truth for the primary navigation. "games" is rendered by GamesMenu on desktop.
// `guest`: hidden for signed-in users (they find Dashboard and Progress in the profile dropdown) via html[data-acct].
const NAV: { href: string; key: string; guest?: boolean }[] = [
  { href: "/", key: "nav.overview" }, { href: "/learn", key: "nav.learn" }, { href: "/library", key: "nav.library" },
  { href: "/setup", key: "nav.practice" }, { href: "/test", key: "nav.test" }, { href: "/daily", key: "nav.daily" },
  { href: "/games", key: "nav.games" }, { href: "/dashboard", key: "nav.dashboard", guest: true }, { href: "/progress", key: "nav.progress", guest: true },
];

/** Same rule as NAV_ACTIVE_SCRIPT in src/lib/prepaint.ts. */
const isNavActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

/** The links themselves. Without `pathname` (the static-shell fallback) nothing is marked active yet. */
function NavLinks({ pathname, drawer }: { pathname?: string; drawer?: boolean }) {
  return NAV.map(({ href, key, guest }) => {
    const active = pathname !== undefined && isNavActive(pathname, href);
    if (href === "/games" && !drawer) return <GamesMenu key={href} active={active} />;
    return (
      <Link key={href} href={href} data-nav="" className={[active && "active", guest && "nav-guest"].filter(Boolean).join(" ") || undefined} aria-current={active ? "page" : undefined}>
        <BiText k={key} />
      </Link>
    );
  });
}

function ActiveNavLinks({ drawer }: { drawer?: boolean }) {
  return <NavLinks pathname={usePathname()} drawer={drawer} />;
}

/**
 * The pathname is URL data: with Cache Components it isn't available while the shared static shell is prerendered.
 * Only the active-link state waits for it (inside this small Suspense boundary); the rest of the navbar is in the
 * shell, so it paints immediately on refresh. NAV_ACTIVE_SCRIPT marks the fallback's active link before paint.
 */
const navLinks = (drawer?: boolean) => (
  <Suspense fallback={<NavLinks drawer={drawer} />}><ActiveNavLinks drawer={drawer} /></Suspense>
);

/** Top navigation, rendered once by the root layout (it persists across client navigations). */
export default function SiteHeader() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // While the mobile drawer is open: Escape, a tap outside the bar, or browser back/forward close it.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      ref.current?.querySelector<HTMLElement>(".tb-burger")?.focus();
    };
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("popstate", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("popstate", close);
    };
  }, [open]);

  // Following a link in the drawer closes it.
  const onDrawerClick = (e: MouseEvent) => { if ((e.target as Element).closest("a")) setOpen(false); };

  return <header className="topbar" ref={ref} data-open={open || undefined}>
    <Link className="brand" href="/" aria-label="DL Typing"><Logo height={30}/></Link>
    <nav className="topnav" aria-label={t("nav.primary")}>{navLinks()}</nav>
    <div className="tb-tools"><ThemeSwitcher/><LocaleToggle/></div>
    <AccountMenu />
    <button type="button" className="tb-burger" aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")} aria-expanded={open} aria-controls="tb-drawer" onClick={() => setOpen((v) => !v)}><span/><span/><span/></button>
    <div className="tb-drawer" id="tb-drawer" onClick={onDrawerClick}>
      <nav aria-label={t("nav.mobile")}>{navLinks(true)}</nav>
      <div className="tb-drawer-tools"><ThemeSwitcher/><LocaleToggle/></div>
    </div>
  </header>;
}
