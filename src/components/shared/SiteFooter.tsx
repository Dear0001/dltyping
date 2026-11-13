"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useSyncExternalStore, type ReactNode } from "react";
import Logo from "@/components/shared/Logo";
import { useLocale } from "@/components/shared/LocaleProvider";
import { typingGames } from "@/data/games";
import { CONTACT } from "@/lib/support";

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

type Item = { label: string; href?: string; node?: ReactNode };

/** Report link that carries the current page (?from=) so the form can prefill "Page where it happened".
 *  Reads the URL, so it must sit inside <Suspense> to keep pages prerenderable. */
function ReportLink({ label }: { label: string }) {
  const pathname = usePathname();
  const from = pathname && !pathname.startsWith("/support") ? `?from=${encodeURIComponent(pathname)}` : "";
  return <Link href={`/support/report${from}`}>{label}</Link>;
}

function Column({ title, ico, items, soon }: { title: string; ico: ReactNode; items: Item[]; soon: string }) {
  return (
    <nav className="sf-col" aria-label={title}>
      <p className="sf-title"><span className="sf-ico">{ico}</span>{title}</p>
      <ul>
        {items.map((it) => (
          <li key={it.label}>
            {it.node ?? (it.href
              ? <Link href={it.href}>{it.label}</Link>
              : <span className="sf-soon">{it.label}<em>{soon}</em></span>)}
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
  const support: Item[] = [
    { label: t("footer.contact"), href: "/support/contact" },
    { label: t("footer.feedback"), href: "/support/feedback" },
    { label: t("footer.report"), href: "/support/report", node: <Suspense fallback={<Link href="/support/report">{t("footer.report")}</Link>}><ReportLink label={t("footer.report")} /></Suspense> },
  ];
  const socials = [
    { href: `mailto:${CONTACT.email}`, label: t("footer.emailAria", { email: CONTACT.email }), icon: icon(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></>) },
    { href: CONTACT.linkedin, label: t("footer.linkedinAria"), external: true, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.6h.05c.53-1 1.84-2.05 3.78-2.05 4.05 0 4.8 2.66 4.8 6.12v5.33h-4v-4.73c0-1.13-.02-2.58-1.57-2.58-1.58 0-1.82 1.23-1.82 2.5v4.81h-4z" /></svg> },
    { href: CONTACT.github, label: t("footer.githubAria"), external: true, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2.25a9.75 9.75 0 0 0-3.08 19c.49.09.67-.21.67-.47v-1.66c-2.71.59-3.28-1.31-3.28-1.31-.44-1.13-1.08-1.43-1.08-1.43-.89-.6.07-.59.07-.59.98.07 1.5 1 1.5 1 .87 1.5 2.29 1.07 2.85.82.09-.63.34-1.07.62-1.31-2.17-.25-4.44-1.08-4.44-4.82 0-1.07.38-1.94 1-2.62-.1-.25-.43-1.24.1-2.58 0 0 .82-.26 2.68 1a9.3 9.3 0 0 1 4.88 0c1.86-1.26 2.68-1 2.68-1 .53 1.34.2 2.33.1 2.58.62.68 1 1.55 1 2.62 0 3.75-2.28 4.57-4.45 4.81.35.3.66.9.66 1.81v2.68c0 .26.18.57.68.47A9.75 9.75 0 0 0 12 2.25z" /></svg> },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="sf-brand">
          <Link href="/" aria-label="DL Typing"><Logo height={36} /></Link>
          <p>{t("footer.tagline")}</p>
          <span className="sf-lang" aria-label={t("results.language")}>{icon(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></>)}{t("footer.langs")}</span>
          <ul className="sf-social" aria-label={t("footer.connect")}>
            {socials.map((s) => (
              <li key={s.href}>
                <a href={s.href} aria-label={s.label} title={s.label} {...(s.external && { target: "_blank", rel: "noopener noreferrer" })}>{s.icon}</a>
              </li>
            ))}
          </ul>
        </div>
        <Column title={t("footer.learning")} ico={icons.learning} items={learning} soon={soon} />
        <Column title={t("footer.games")} ico={icons.games} items={games} soon={soon} />
        <Column title={t("footer.resources")} ico={icons.resources} items={resources} soon={soon} />
        <Column title={t("footer.support")} ico={icons.support} items={support} soon={soon} />
      </div>
      <div className="site-footer-bar">
        <span>© {year} DL Typing. {t("footer.rights")}</span>
        <span className="sf-legal">
          <Link href="/privacy">{t("footer.privacy")}</Link>
          <Link href="/terms">{t("footer.terms")}</Link>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{t("footer.top")} ↑</button>
        </span>
      </div>
    </footer>
  );
}
