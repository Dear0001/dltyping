"use client";

import Link from "next/link";
import { useLocale } from "@/components/shared/LocaleProvider";
import { PageHeader, cardClass } from "@/components/ui/ui";
import { CONTACT } from "@/lib/support";

/** Section n of a document: how many bullet points it has, and whether a second paragraph follows them. */
type Section = { li?: number; p?: boolean; p2?: boolean };

const DOCS = {
  pp: { other: { href: "/terms", key: "legal.seeTerms" }, sections: [{ li: 4 }, { p: true }, { p: true, li: 3 }, { p: true }, { p: true }, { p: true, li: 3 }, { p: true, li: 3, p2: true }, { p: true }, { p: true }] },
  tos: { other: { href: "/privacy", key: "legal.seePrivacy" }, sections: [{ p: true }, { p: true }, { p: true, li: 3, p2: true }, { p: true }, { p: true }, { p: true }, { p: true }] },
} satisfies Record<string, { other: { href: string; key: string }; sections: Section[] }>;

/** Privacy Policy and Terms of Service body. Client component so it follows the language switch; text in messages/legal.ts. */
export default function LegalPage({ doc }: { doc: keyof typeof DOCS }) {
  const { t, locale } = useLocale();
  const { sections, other } = DOCS[doc];
  const k = (n: number, part: string) => `legal.${doc}.${n}.${part}`;
  const km = locale === "km" ? "font-khmer" : "";

  return (
    <div className="min-h-screen bg-surface text-navy">
      <main className={`mx-auto max-w-3xl px-4 py-12 sm:px-6 ${km}`}>
        <PageHeader kicker={t("legal.updated", { date: t("legal.date") })} title={t(`legal.${doc}.title`)} subtitle={t(`legal.${doc}.intro`)} />

        <nav aria-label={t("legal.contents")} className={`${cardClass} mb-6 p-5`}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-mute">{t("legal.contents")}</p>
          <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((_, i) => (
              <li key={i}><a href={`#s${i + 1}`} className="font-semibold text-brand hover:underline">{i + 1}. {t(k(i + 1, "t"))}</a></li>
            ))}
          </ol>
        </nav>

        <div className="space-y-4">
          {sections.map((s: Section, i) => {
            const n = i + 1;
            return (
              <section key={n} id={`s${n}`} aria-labelledby={`s${n}-h`} className={`${cardClass} scroll-mt-24 p-6`}>
                <h2 id={`s${n}-h`} className="text-lg font-bold">{n}. {t(k(n, "t"))}</h2>
                {s.p && <p className="mt-2 leading-relaxed text-mute">{t(k(n, "p"))}</p>}
                {s.li && (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-mute marker:text-brand">
                    {Array.from({ length: s.li }, (_, j) => <li key={j}>{t(k(n, `li${j + 1}`))}</li>)}
                  </ul>
                )}
                {s.p2 && <p className="mt-3 leading-relaxed text-mute">{t(k(n, "p2"))}</p>}
              </section>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-mute">
          {t("legal.questions", { email: CONTACT.email })}{" "}
          <Link href="/support/contact" className="font-semibold text-brand hover:underline">{t("legal.contactForm")}</Link>
          {" · "}
          <Link href={other.href} className="font-semibold text-brand hover:underline">{t(other.key)}</Link>
        </p>
      </main>
    </div>
  );
}
