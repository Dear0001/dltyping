"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import Logo from "@/components/shared/Logo";
import { useLocale } from "@/components/shared/LocaleProvider";
import { typingGames } from "@/data/games";

const noop = () => () => {};
const useYear = () => useSyncExternalStore(noop, () => new Date().getFullYear(), () => 2026);

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const icons = {
  learning: icon(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16" /></>),
  games: icon(<><rect x="2.5" y="7" width="19" height="11" rx="4" /><path d="M7 10.5v4M5 12.5h4M15.5 11h.01M18 14h.01" /></>),
  resources: icon(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></>),
  support: icon(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" /></>),
};

type Item = { label: string; href?: string };

function Column({ title, ico, items, soon }: { title: string; ico: ReactNode; items: Item[]; soon: string }) {
  return (
    <nav className="sf-col" aria-label={title}>
      <p className="sf-title"><span className="sf-ico">{ico}</span>{title}</p>
      <ul>
        {items.map((it) => (
          <li key={it.label}>
            {it.href
              ? <Link href={it.href}>{it.label}</Link>
              : <span className="sf-soon">{it.label}<em>{soon}</em></span>}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Site-wide footer, rendered once from the root layout. Hidden on game play pages via CSS (see .gm-page). */
export default function SiteFooter() {
  const { t } = useLocale();
  const year = useYear();
  const soon = t("footer.soon");

  const learning: Item[] = [
    { label: t("footer.english"), href: "/learn/english" },
    { label: t("footer.khmer"), href: "/learn/khmer" },
    { label: t("footer.curriculum"), href: "/learn" },
    { label: t("footer.library"), href: "/library" },
    { label: t("footer.quick"), href: "/setup" },
  ];
  const games: Item[] = [...typingGames.map((g) => ({ label: t(`game.${g.id}.title`), href: g.href })), { label: t("footer.allGames"), href: "/games" }];
  const resources: Item[] = [
    { label: t("footer.howto"), href: "/help#how-to" },
    { label: t("footer.qwerty"), href: "/help#qwerty" },
    { label: t("footer.nida"), href: "/help#nida" },
    { label: t("footer.faq"), href: "/help#faq" },
  ];
  const support: Item[] = [t("footer.contact"), t("footer.feedback"), t("footer.report")].map((label) => ({ label }));

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="sf-brand">
          <Link href="/" aria-label="DL Typing"><Logo height={36} /></Link>
          <p>{t("footer.tagline")}</p>
          <span className="sf-lang" aria-label="Languages">{icon(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></>)}{t("footer.langs")}</span>
        </div>
        <Column title={t("footer.learning")} ico={icons.learning} items={learning} soon={soon} />
        <Column title={t("footer.games")} ico={icons.games} items={games} soon={soon} />
        <Column title={t("footer.resources")} ico={icons.resources} items={resources} soon={soon} />
        <Column title={t("footer.support")} ico={icons.support} items={support} soon={soon} />
      </div>
      <div className="site-footer-bar">
        <span>© {year} DL Typing. {t("footer.rights")}</span>
        <span className="sf-legal">
          <span className="sf-soon">{t("footer.privacy")}<em>{soon}</em></span>
          <span className="sf-soon">{t("footer.terms")}<em>{soon}</em></span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{t("footer.top")} ↑</button>
        </span>
      </div>
    </footer>
  );
}
