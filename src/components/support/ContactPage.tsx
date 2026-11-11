"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";
import { CATEGORIES, CONTACT, LIMITS } from "@/lib/support";
import { ErrorBanner, Field, Icon, SubmitButton, SuccessPanel, SupportNav, inputCls, useSupportForm } from "./shared";

/** Contact Us: friendly two-column layout, direct contact cards on the left and the message form on the right. */
export default function ContactPage() {
  const { t } = useLocale();
  const f = useSupportForm("contact");
  const { values: v, errors: e } = f;

  return (
    <div className="min-h-screen bg-surface text-navy">
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
        <section aria-labelledby="contact-title" className="min-w-0">
          <SupportNav current="contact" />
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.14em] text-brand">{t("support.contact.eyebrow")}</p>
          <h1 id="contact-title" className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t("support.contact.title")}</h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-600">{t("support.contact.intro")}</p>

          <h2 className="sr-only">{t("support.contact.ways")}</h2>
          <ul className="mt-8 space-y-3">
            <ContactCard href={`mailto:${CONTACT.email}`} icon={<Icon.mail />} tone="bg-brand text-white" label={t("support.contact.card.email")}
              value={CONTACT.email} hint={t("support.contact.card.emailHint")} aria={t("support.contact.card.emailAria", { email: CONTACT.email })} />
            <ContactCard href={CONTACT.linkedin} external icon={<Icon.linkedin />} tone="bg-[#0a66c2] text-white" label={t("support.contact.card.linkedin")}
              value="Dalen Phea" hint={t("support.contact.card.linkedinHint")} aria={`${t("support.contact.card.linkedin")}: Dalen Phea ${t("support.newTab")}`} />
            <ContactCard href={CONTACT.github} external icon={<Icon.github />} tone="bg-navy text-white" label={t("support.contact.card.github")}
              value="@Dear0001" hint={t("support.contact.card.githubHint")} aria={`${t("support.contact.card.github")}: Dear0001 ${t("support.newTab")}`} />
          </ul>

          <div className="mt-8 rounded-2xl border border-accent/40 bg-accent/10 p-5">
            <p className="font-bold">{t("support.contact.faqTitle")}</p>
            <p className="mt-1 text-sm text-slate-600">{t("support.contact.faqBody")}</p>
            <Link href="/help#faq" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">{t("support.contact.faqLink")} <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <section aria-labelledby="contact-form-title" className="min-w-0 self-start rounded-3xl bg-white p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] ring-1 ring-slate-200 sm:p-8">
          {f.status.state === "done" ? (
            <SuccessPanel title={t("support.contact.successTitle")} body={t("support.contact.successBody", { email: v.email ?? "" })} action={t("support.contact.again")} onAgain={f.reset} />
          ) : (
            <form onSubmit={f.submit} noValidate className="space-y-5">
              <div>
                <h2 id="contact-form-title" className="text-xl font-extrabold">{t("support.contact.formTitle")}</h2>
                <p className="mt-1 text-sm text-mute">{t("support.contact.formIntro")}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field name="name" label={t("support.f.name")} error={e.name}>
                  {(a) => <input {...a} className={inputCls} value={v.name ?? ""} maxLength={LIMITS.name} autoComplete="name" placeholder={t("support.f.namePh")} onChange={(x) => f.set("name", x.target.value)} />}
                </Field>
                <Field name="email" label={t("support.f.email")} error={e.email}>
                  {(a) => <input {...a} type="email" inputMode="email" className={inputCls} value={v.email ?? ""} maxLength={LIMITS.email} autoComplete="email" placeholder={t("support.f.emailPh")} onChange={(x) => f.set("email", x.target.value)} />}
                </Field>
              </div>
              <Field name="category" label={t("support.f.category")} error={e.category}>
                {(a) => (
                  <select {...a} className={inputCls} value={v.category ?? ""} onChange={(x) => f.set("category", x.target.value)}>
                    <option value="" disabled>{t("support.f.categoryPick")}</option>
                    {CATEGORIES.contact.map((c) => <option key={c} value={c}>{t(`support.cat.contact.${c}`)}</option>)}
                  </select>
                )}
              </Field>
              <Field name="subject" label={t("support.f.subject")} error={e.subject}>
                {(a) => <input {...a} className={inputCls} value={v.subject ?? ""} maxLength={LIMITS.subjectMax} placeholder={t("support.contact.subjectPh")} onChange={(x) => f.set("subject", x.target.value)} />}
              </Field>
              <Field name="message" label={t("support.f.message")} error={e.message} count={(v.message ?? "").length} max={LIMITS.messageMax}>
                {(a) => <textarea {...a} rows={6} className={`${inputCls} resize-y`} value={v.message ?? ""} maxLength={LIMITS.messageMax} placeholder={t("support.contact.messagePh")} onChange={(x) => f.set("message", x.target.value)} />}
              </Field>
              <ErrorBanner message={f.status.state === "error" ? f.status.message : undefined} />
              <SubmitButton sending={f.sending} label={t("support.contact.send")} className="w-full sm:w-auto" />
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function ContactCard({ href, external, icon, tone, label, value, hint, aria }: { href: string; external?: boolean; icon: ReactNode; tone: string; label: string; value: string; hint: string; aria: string }) {
  return (
    <li>
      <a href={href} aria-label={aria} {...(external && { target: "_blank", rel: "noopener noreferrer" })}
        className="group flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <span className={`grid h-12 w-12 flex-none place-items-center rounded-xl ${tone}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold uppercase tracking-wider text-mute">{label}</span>
          <span className="block truncate text-[15px] font-bold text-navy group-hover:text-brand">{value}</span>
          <span className="block truncate text-[13px] text-mute">{hint}</span>
        </span>
        <span className="flex-none text-slate-400 transition group-hover:text-brand">{external ? <Icon.external /> : <span aria-hidden="true">→</span>}</span>
      </a>
    </li>
  );
}
