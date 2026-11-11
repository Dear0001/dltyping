"use client";

import ShareButtons from "@/components/shared/ShareButtons";
import { useLocale } from "@/components/shared/LocaleProvider";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const link = "font-semibold text-brand underline-offset-2 hover:underline";

/** Homepage copy. A client component so it follows the language switch; it still renders (English) on the server so the text stays crawlable. */
export default function LandingContent({ siteUrl }: { siteUrl: string }) {
  const { t } = useLocale();
  return <>
    <section className="mx-auto max-w-6xl px-4 pb-6 pt-2 sm:px-6" aria-labelledby="how-heading">
      <h2 id="how-heading" className="text-2xl font-extrabold sm:text-3xl">{t("home.howTitle")}</h2>
      <p className="mt-2 max-w-3xl text-slate-600">{t("home.howIntro")}</p>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((n) => <li key={n} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden="true">{n}</span>
          <p className="mt-3 font-extrabold">{t(`home.step${n}Title`)}</p>
          <p className="mt-1 text-sm text-slate-600">{t(`home.step${n}Text`)}</p>
        </li>)}
      </ol>
    </section>

    <section className="bg-white py-14" aria-labelledby="tips-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="tips-heading" className="text-2xl font-extrabold sm:text-3xl">{t("home.tipsTitle")}</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          <a href="https://en.wikipedia.org/wiki/Touch_typing" {...ext} className={link}>{t("home.tipsIntro1")}</a>{t("home.tipsIntro2")}<a href="https://en.wikipedia.org/wiki/Words_per_minute" {...ext} className={link}>{t("home.tipsIntro3")}</a>{t("home.tipsIntro4")}
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => <li key={n} className="rounded-2xl border border-slate-200 bg-surface p-5">
            <p className="font-extrabold">{t(`home.tip${n}Title`)}</p>
            <p className="mt-1 text-sm text-slate-600">{t(`home.tip${n}Text`)}</p>
          </li>)}
        </ul>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="khmer-heading">
      <h2 id="khmer-heading" className="text-2xl font-extrabold sm:text-3xl">{t("home.khTitle")}</h2>
      <div className="mt-3 max-w-3xl space-y-3 text-slate-600">
        <p>{t("home.khP1a")}<a href="https://en.wikipedia.org/wiki/Khmer_alphabet" {...ext} className={link}>{t("home.khP1b")}</a>{t("home.khP1c")}</p>
        <p>{t("home.khP2a")}<a href="https://www.unicode.org/charts/PDF/U1780.pdf" {...ext} className={link}>{t("home.khP2b")}</a>{t("home.khP2c")}</p>
        <p>{t("home.khP3")}</p>
      </div>
    </section>

    <section className="bg-white py-14" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 id="faq-heading" className="text-2xl font-extrabold sm:text-3xl">{t("home.faqTitle")}</h2>
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => <details key={n} className="group rounded-2xl border border-slate-200 bg-surface p-5">
            <summary className="cursor-pointer list-none font-extrabold">{t(`home.faq${n}q`)}</summary>
            <p className="mt-2 text-sm text-slate-600">{t(`home.faq${n}a`)}</p>
          </details>)}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="share-heading">
      <h2 id="share-heading" className="text-2xl font-extrabold sm:text-3xl">{t("home.shareTitle")}</h2>
      <p className="mb-5 mt-2 max-w-3xl text-slate-600">{t("home.shareText")}</p>
      <ShareButtons url={siteUrl} text={t("home.shareMsg")} />
    </section>
  </>;
}
