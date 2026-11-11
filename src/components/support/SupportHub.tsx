"use client";

import Link from "next/link";
import { useLocale } from "@/components/shared/LocaleProvider";
import { Icon } from "./shared";

const CARDS = [
  { kind: "contact", href: "/support/contact", icon: <Icon.mail />, tone: "bg-brand text-white" },
  { kind: "feedback", href: "/support/feedback", icon: <Icon.bulb />, tone: "bg-accent/25 text-brand" },
  { kind: "report", href: "/support/report", icon: <Icon.alert />, tone: "bg-navy text-white" },
] as const;

/** /support: a small chooser that links to the three support pages. */
export default function SupportHub() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-surface text-navy">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("support.hub.title")}</h1>
        <p className="mt-3 max-w-xl text-lg text-slate-600">{t("support.hub.subtitle")}</p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {CARDS.map((c) => (
            <li key={c.kind}>
              <Link href={c.href} className="group flex h-full flex-col rounded-3xl bg-white p-6 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg hover:ring-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${c.tone}`}>{c.icon}</span>
                <span className="mt-5 text-xl font-extrabold">{t(`support.nav.${c.kind}`)}</span>
                <span className="mt-2 flex-1 text-slate-600">{t(`support.hub.${c.kind}`)}</span>
                <span className="mt-5 font-bold text-brand">{t("support.hub.open")} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-1">→</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
