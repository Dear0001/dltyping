"use client";

import ShareButtons from "@/components/shared/ShareButtons";
import { useLocale } from "@/components/shared/LocaleProvider";
import { FACT_VARS } from "@/lib/site-facts";
import { Icon, SectionHeading, cardClass, cx } from "@/components/ui/ui";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const link = "font-semibold text-brand underline-offset-2 hover:underline";

/** Homepage reference copy (how it works, tips, Khmer notes, FAQ). A client component so it follows the language switch; it still renders on the server so the text stays crawlable. */
export default function LandingContent({ siteUrl }: { siteUrl: string }) {
  const { t } = useLocale();
  return <>
    {/* How it works: three steps on one line */}
    <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6" aria-labelledby="how-heading">
      <SectionHeading id="how-heading" title={t("home.howTitle")} subtitle={t("home.howIntro")} />
      <ol className="grid gap-4 md:grid-cols-3">
        {([["practice", 1], ["learn", 2], ["games", 3]] as const).map(([icon, n]) => <li key={n} className={cx(cardClass, "relative p-5")}>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-extrabold text-white" aria-hidden="true">{n}</span>
            <Icon name={icon} size={20} className="text-mute" />
          </div>
          <p className="mt-3 font-extrabold text-navy">{t(`home.step${n}Title`)}</p>
          <p className="mt-1 text-sm leading-relaxed text-mute">{t(`home.step${n}Text`, FACT_VARS)}</p>
        </li>)}
      </ol>
    </section>

    {/* Tips: compact checklist */}
    <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6" aria-labelledby="tips-heading">
      <div className={cx(cardClass, "grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_2fr]")}>
        <div>
          <h2 id="tips-heading" className="text-xl font-extrabold tracking-tight text-navy sm:text-2xl">{t("home.tipsTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-mute">
            <a href="https://en.wikipedia.org/wiki/Touch_typing" {...ext} className={link}>{t("home.tipsIntro1")}</a>{t("home.tipsIntro2")}<a href="https://en.wikipedia.org/wiki/Words_per_minute" {...ext} className={link}>{t("home.tipsIntro3")}</a>{t("home.tipsIntro4")}
          </p>
        </div>
        <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((n) => <li key={n} className="flex gap-3">
            <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-blue-50 text-brand"><Icon name="check" size={14} strokeWidth={2.6} /></span>
            <div><p className="font-bold text-navy">{t(`home.tip${n}Title`)}</p><p className="mt-0.5 text-sm leading-relaxed text-mute">{t(`home.tip${n}Text`)}</p></div>
          </li>)}
        </ul>
      </div>
    </section>

    {/* Khmer notes + FAQ side by side */}
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.25fr]">
      <div aria-labelledby="khmer-heading">
        <h2 id="khmer-heading" className="text-xl font-extrabold tracking-tight text-navy sm:text-2xl">{t("home.khTitle")}</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-mute">
          <p>{t("home.khP1a")}<a href="https://en.wikipedia.org/wiki/Khmer_alphabet" {...ext} className={link}>{t("home.khP1b")}</a>{t("home.khP1c")}</p>
          <p>{t("home.khP2a")}<a href="https://www.unicode.org/charts/PDF/U1780.pdf" {...ext} className={link}>{t("home.khP2b")}</a>{t("home.khP2c")}</p>
          <p>{t("home.khP3")}</p>
        </div>
        <div className="mt-8 rounded-2xl bg-blue-50 p-5 ring-1 ring-inset ring-blue-100" aria-labelledby="share-heading">
          <h2 id="share-heading" className="font-extrabold text-navy">{t("home.shareTitle")}</h2>
          <p className="mb-4 mt-1 text-sm text-mute">{t("home.shareText")}</p>
          <ShareButtons url={siteUrl} text={t("home.shareMsg")} />
        </div>
      </div>
      <div aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-xl font-extrabold tracking-tight text-navy sm:text-2xl">{t("home.faqTitle")}</h2>
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => <details key={n} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-bold text-navy hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              {t(`home.faq${n}q`)}<Icon name="chevron" size={18} className="text-mute transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-4 text-sm leading-relaxed text-mute">{t(`home.faq${n}a`)}</p>
          </details>)}
        </div>
      </div>
    </section>
  </>;
}
