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
import Icon, { type IconName } from "@/components/ui/Icon";
import { useLocale } from "@/components/shared/LocaleProvider";

type SubItem = { href: string; key: string; desc: string; icon: IconName };
type NavEntry = { href: string; key: string; icon: IconName; match?: string[]; menu?: SubItem[]; games?: true };

/**
 * Single source of truth for the primary navigation: five destinations, with secondary pages grouped under them.
 * `match` lists the path prefixes that mark an item active (default: its own href). Same rule as NAV_ACTIVE_SCRIPT.
 */
export const NAV: NavEntry[] = [
  { href: "/", key: "nav.overview", icon: "home" },
  { href: "/learn", key: "nav.learn", icon: "learn" },
  {
    href: "/setup", key: "nav.practice", icon: "practice", match: ["/setup", "/test", "/daily", "/library"],
    menu: [
      { href: "/setup", key: "ui.nav.quick", desc: "ui.nav.quick.d", icon: "practice" },
      { href: "/test", key: "ui.nav.test", desc: "ui.nav.test.d", icon: "test" },
      { href: "/daily", key: "ui.nav.daily", desc: "ui.nav.daily.d", icon: "daily" },
      { href: "/library", key: "ui.nav.library", desc: "ui.nav.library.d", icon: "library" },
    ],
  },
  { href: "/games", key: "nav.games", icon: "games", games: true },
  {
    href: "/progress", key: "nav.progress", icon: "progress", match: ["/progress", "/dashboard", "/pets"],
    menu: [
      { href: "/progress", key: "ui.nav.overview", desc: "ui.nav.overview.d", icon: "trophy" },
      { href: "/dashboard", key: "nav.dashboard", desc: "ui.nav.dashboard.d", icon: "dashboard" },
      { href: "/dashboard/keyboard-mastery", key: "ui.nav.mastery", desc: "ui.nav.mastery.d", icon: "keyboard" },
      { href: "/dashboard/training", key: "ui.nav.training", desc: "ui.nav.training.d", icon: "target" },
      { href: "/pets", key: "nav.pets", desc: "ui.nav.pets.d", icon: "paw" },
    ],
  },
];

const EXTRA: SubItem[] = [
  { href: "/help", key: "ui.nav.help", desc: "", icon: "help" },
  { href: "/support", key: "ui.nav.support", desc: "", icon: "globe" },
];

/** Same rule as NAV_ACTIVE_SCRIPT in src/lib/prepaint.ts. */
const isNavActive = (pathname: string, entry: { href: string; match?: string[] }) =>
  entry.href === "/" ? pathname === "/" : (entry.match ?? [entry.href]).some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Dropdown for a nav group (Practice, Progress). Opens on hover or keyboard focus, like the Games menu. */
function NavMenu({ entry, active, pathname }: { entry: NavEntry; active: boolean; pathname?: string }) {
  const { t } = useLocale();
  // After picking an item the pointer is still over the menu, so it would stay open on the new page.
  const [closed, setClosed] = useState(false);
  const reopen = () => { if (closed) setClosed(false); };
  const onMenuClick = (e: MouseEvent) => {
    if (!(e.target as Element).closest("a")) return;
    setClosed(true);
    (document.activeElement as HTMLElement | null)?.blur();
  };
  return <div className="gm-wrap nm-wrap" data-closed={closed || undefined} onMouseEnter={reopen} onMouseLeave={reopen} onFocus={reopen}>
    <Link data-nav="" data-match={entry.match?.join(" ")} className={`gm-trigger${active ? " active" : ""}`} href={entry.href} aria-haspopup="menu"><BiText k={entry.key} /><Icon name="chevron" size={14} className="gm-caret" strokeWidth={2.2} /></Link>
    <div className="gm-menu nm-menu" role="menu" onClick={onMenuClick}>
      {entry.menu!.map((item) => <Link key={item.href} role="menuitem" className={`nm-item${pathname === item.href ? " is-current" : ""}`} href={item.href}>
        <span className="nm-icon"><Icon name={item.icon} size={18} /></span>
        <span className="nm-text"><strong>{t(item.key)}</strong><small>{t(item.desc)}</small></span>
      </Link>)}
    </div>
  </div>;
}

/** Desktop links. Without `pathname` (the static-shell fallback) nothing is marked active yet. */
function DesktopLinks({ pathname }: { pathname?: string }) {
  return NAV.map((entry) => {
    const active = pathname !== undefined && isNavActive(pathname, entry);
    if (entry.games) return <GamesMenu key={entry.href} active={active} />;
    if (entry.menu) return <NavMenu key={entry.href} entry={entry} active={active} pathname={pathname} />;
    return <Link key={entry.href} href={entry.href} data-nav="" className={active ? "active" : undefined} aria-current={active ? "page" : undefined}><BiText k={entry.key} /></Link>;
  });
}

/** Mobile drawer: the five destinations as large rows, each group's pages listed underneath. */
function DrawerLinks({ pathname }: { pathname?: string }) {
  return <>
    {NAV.map((entry) => {
      const active = pathname !== undefined && isNavActive(pathname, entry);
      return <div key={entry.href} className="dr-group">
        <Link href={entry.href} data-nav="" data-match={entry.match?.join(" ")} className={`dr-main${active ? " active" : ""}`} aria-current={active && pathname === entry.href ? "page" : undefined}>
          <span className="dr-icon"><Icon name={entry.icon} size={19} /></span><BiText k={entry.key} />
        </Link>
        {entry.menu && <div className="dr-sub">{entry.menu.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "is-current" : undefined} aria-current={pathname === item.href ? "page" : undefined}><Icon name={item.icon} size={15} /><BiText k={item.key} /></Link>)}</div>}
      </div>;
    })}
    <div className="dr-sub dr-extra">{EXTRA.map((item) => <Link key={item.href} href={item.href}><Icon name={item.icon} size={15} /><BiText k={item.key} /></Link>)}</div>
  </>;
}

function ActiveDesktop() { return <DesktopLinks pathname={usePathname()} />; }
function ActiveDrawer() { return <DrawerLinks pathname={usePathname()} />; }

/**
 * The pathname is URL data: with Cache Components it isn't available while the shared static shell is prerendered.
 * Only the active-link state waits for it (inside these small Suspense boundaries); the rest of the navbar is in the
 * shell, so it paints immediately on refresh. NAV_ACTIVE_SCRIPT marks the fallback's active link before paint.
 */
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
    <Link className="brand" href="/" aria-label="DL Typing"><Logo height={28}/></Link>
    <nav className="topnav" aria-label={t("nav.primary")}><Suspense fallback={<DesktopLinks />}><ActiveDesktop /></Suspense></nav>
    <div className="tb-tools"><ThemeSwitcher/><LocaleToggle/></div>
    <AccountMenu />
    <button type="button" className="tb-burger" aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")} aria-expanded={open} aria-controls="tb-drawer" onClick={() => setOpen((v) => !v)}><span/><span/><span/></button>
    <div className="tb-drawer" id="tb-drawer" onClick={onDrawerClick}>
      <nav aria-label={t("nav.mobile")}><Suspense fallback={<DrawerLinks />}><ActiveDrawer /></Suspense></nav>
      <div className="tb-drawer-tools"><span className="dr-label">{t("ui.nav.settings")}</span><div className="dr-tools-row"><ThemeSwitcher/><LocaleToggle/></div></div>
    </div>
  </header>;
}
