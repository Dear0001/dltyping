"use client";

import { useState } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";
import { CATEGORIES, LIMITS } from "@/lib/support";
import { ErrorBanner, Field, Icon, SubmitButton, SuccessPanel, SupportNav, fieldId, inputCls, useErrorText, useSupportForm } from "./shared";

/** Feedback: a single centred card with tappable topic chips and an optional 5-star rating. */
export default function FeedbackPage() {
  const { t } = useLocale();
  const errorText = useErrorText();
  const f = useSupportForm("feedback");
  const { values: v, errors: e } = f;
  const rating = Number(v.rating ?? 0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface text-navy">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
      <main className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex justify-center"><SupportNav current="feedback" /></div>
        <header className="mt-8 text-center">
          <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-accent/20 text-brand"><Icon.bulb /></span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{t("support.feedback.title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-slate-600">{t("support.feedback.intro")}</p>
        </header>

        <section className="mt-10 rounded-3xl bg-white p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] ring-1 ring-slate-200 sm:p-9" aria-label={t("support.feedback.eyebrow")}>
          {f.status.state === "done" ? (
            <SuccessPanel title={t("support.feedback.successTitle")} body={t("support.feedback.successBody")} action={t("support.feedback.again")} onAgain={() => { f.reset(); setHover(0); }} />
          ) : (
            <form onSubmit={f.submit} noValidate className="space-y-7">
              <fieldset aria-describedby={e.category ? `${fieldId("category")}-err` : undefined}>
                <legend className="text-sm font-semibold">{t("support.feedback.catLegend")}<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CATEGORIES.feedback.map((c, i) => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="category" value={c} checked={v.category === c} onChange={() => f.set("category", c)}
                        id={i === 0 ? fieldId("category") : undefined} className="peer sr-only" />
                      <span className="inline-block rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-brand/25">
                        {t(`support.cat.feedback.${c}`)}
                      </span>
                    </label>
                  ))}
                </div>
                {e.category && <p id={`${fieldId("category")}-err`} className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-red-600"><Icon.alert />{errorText("category", e.category)}</p>}
              </fieldset>

              <fieldset className="rounded-2xl bg-surface/60 p-5 text-center">
                <legend className="sr-only">{t("support.feedback.ratingLegend")} ({t("support.f.optional")})</legend>
                <p aria-hidden="true" className="text-sm font-semibold">{t("support.feedback.ratingLegend")} <span className="font-normal text-mute">({t("support.f.optional")})</span></p>
                <div className="mt-2 flex justify-center gap-1" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
                      <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => f.set("rating", String(n))} className="peer sr-only" aria-label={`${t("support.feedback.star", { n })}: ${t(`support.feedback.rate${n}`)}`} />
                      <span className={`block rounded-lg p-0.5 transition peer-focus-visible:ring-4 peer-focus-visible:ring-brand/30 ${n <= shown ? "text-amber-400" : "text-slate-300"} hover:scale-110`}>{Icon.star(n <= shown)}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 h-5 text-sm font-semibold text-slate-600" aria-live="polite">{shown ? t(`support.feedback.rate${shown}`) : t("support.feedback.rateNone")}</p>
                {rating > 0 && <button type="button" onClick={() => f.set("rating", "")} className="mt-1 text-xs font-semibold text-mute underline-offset-2 hover:text-brand hover:underline">{t("support.feedback.rateClear")}</button>}
              </fieldset>

              <Field name="subject" label={t("support.f.subject")} error={e.subject}>
                {(a) => <input {...a} className={inputCls} value={v.subject ?? ""} maxLength={LIMITS.subjectMax} placeholder={t("support.feedback.subjectPh")} onChange={(x) => f.set("subject", x.target.value)} />}
              </Field>
              <Field name="message" label={t("support.feedback.message")} error={e.message} count={(v.message ?? "").length} max={LIMITS.messageMax}>
                {(a) => <textarea {...a} rows={6} className={`${inputCls} resize-y`} value={v.message ?? ""} maxLength={LIMITS.messageMax} placeholder={t("support.feedback.messagePh")} onChange={(x) => f.set("message", x.target.value)} />}
              </Field>
              <Field name="email" label={t("support.f.email")} optional hint={t("support.feedback.emailHint")} error={e.email}>
                {(a) => <input {...a} type="email" inputMode="email" className={inputCls} value={v.email ?? ""} maxLength={LIMITS.email} autoComplete="email" placeholder={t("support.f.emailPh")} onChange={(x) => f.set("email", x.target.value)} />}
              </Field>
              <ErrorBanner message={f.status.state === "error" ? f.status.message : undefined} />
              <div className="flex justify-center"><SubmitButton sending={f.sending} label={t("support.feedback.send")} className="w-full sm:w-auto sm:min-w-56" /></div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
