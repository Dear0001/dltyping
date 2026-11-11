"use client";

import Link from "next/link";
import { useLocale } from "@/components/shared/LocaleProvider";

const card = "rounded-2xl border border-slate-200 bg-white p-6";

/** Help page body. A client component so it follows the language switch; it still renders (English) on the server. */
export default function HelpContent() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-surface text-navy">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold">{t("help.title")}</h1>
        <p className="mt-2 text-mute">{t("help.subtitle")}</p>

        <section id="how-to" className={`${card} mt-8 scroll-mt-24`}>
          <h2 className="text-xl font-bold">{t("help.howTitle")}</h2>
          <ol className="mt-4 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="flex gap-3">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand text-sm font-bold text-white">{n}</span>
                <p><strong>{t(`help.step${n}t`)}.</strong> <span className="text-mute">{t(`help.step${n}`)}</span></p>
              </li>
            ))}
          </ol>
        </section>

        <section id="keyboards" className={`${card} mt-6 scroll-mt-24`}>
          <h2 className="text-xl font-bold">{t("help.kbTitle")}</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div id="qwerty">
              <h3 className="font-bold">{t("help.qwertyTitle")}</h3>
              <p className="mt-1 text-mute">{t("help.qwerty")}</p>
              <Link href="/learn/english" className="mt-2 inline-block font-semibold text-brand hover:underline">{t("dash.practiceEn")} →</Link>
            </div>
            <div id="nida">
              <h3 className="font-bold">{t("help.nidaTitle")}</h3>
              <p className="mt-1 text-mute">{t("help.nida")}</p>
              <Link href="/learn/khmer" className="mt-2 inline-block font-semibold text-brand hover:underline">{t("dash.practiceKh")} →</Link>
            </div>
          </div>
        </section>

        <section id="faq" className={`${card} mt-6 scroll-mt-24`}>
          <h2 className="text-xl font-bold">{t("help.faqTitle")}</h2>
          <dl className="mt-4 space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n}><dt className="font-bold">{t(`help.faq${n}q`)}</dt><dd className="mt-1 text-mute">{t(`help.faq${n}`)}</dd></div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
