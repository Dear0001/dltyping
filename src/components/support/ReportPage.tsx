"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type DragEvent, type ReactNode } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";
import { ATTACHMENT, CATEGORIES, LIMITS, checkAttachmentMeta } from "@/lib/support";
import { ErrorBanner, Field, Icon, SubmitButton, SuccessPanel, SupportNav, fieldId, inputCls, useErrorText, useSupportForm } from "./shared";

const noopSubscribe = () => () => {};
/** The page the person was on: `?from=/path` (added by the footer link) or a same-site referrer. Empty on the server. */
function detectPage() {
  try {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/support")) return window.location.origin + from;
    const ref = document.referrer && new URL(document.referrer);
    if (ref && ref.origin === window.location.origin && !ref.pathname.startsWith("/support")) return ref.href;
  } catch {
    // Unparseable referrer: leave it blank for the person to fill in.
  }
  return "";
}

const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

/** Report a Problem: structured three-step form with reproduction details, the page URL and an optional screenshot. */
export default function ReportPage() {
  const { t } = useLocale();
  const errorText = useErrorText();
  const f = useSupportForm("report");
  const { values: v, errors: e } = f;
  const detected = useSyncExternalStore(noopSubscribe, detectPage, () => "");
  const pageUrl = v.pageUrl ?? detected;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  const pick = (next: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreview(null);
    if (inputRef.current && !next) inputRef.current.value = "";
    const problem = next ? checkAttachmentMeta(next) : null;
    f.setFieldError("attachment", problem ?? undefined);
    if (!next || problem) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(next);
    if (next.type.startsWith("image/")) {
      previewRef.current = URL.createObjectURL(next);
      setPreview(previewRef.current);
    }
  };
  const onDrop = (ev: DragEvent) => {
    ev.preventDefault();
    setDragging(false);
    pick(ev.dataTransfer.files[0] ?? null);
  };

  const again = () => { f.reset(); pick(null); };

  return (
    <div className="min-h-screen bg-surface text-navy">
      <header className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-12">
          <SupportNav current="report" tone="dark" />
          <p className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-accent"><span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />{t("support.report.eyebrow")}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t("support.report.title")}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">{t("support.report.intro")}</p>
        </div>
      </header>

      <main className="mx-auto -mt-16 grid max-w-6xl gap-6 px-4 pb-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 rounded-3xl bg-white p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)] ring-1 ring-slate-200 sm:p-8" aria-label={t("support.report.eyebrow")}>
          {f.status.state === "done" ? (
            <SuccessPanel title={t("support.report.successTitle")} body={t("support.report.successBody")} action={t("support.report.again")} onAgain={again}>
              {f.status.reference && (
                <div className="mt-5 rounded-2xl border border-dashed border-brand/40 bg-brand/5 px-6 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-mute">{t("support.report.reference")}</p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-brand">{f.status.reference}</p>
                  <p className="mt-1 text-[13px] text-mute">{t("support.report.referenceHint")}</p>
                </div>
              )}
            </SuccessPanel>
          ) : (
            <form onSubmit={(ev) => f.submit(ev, { fields: { pageUrl }, attachment: file, clientErrors: e.attachment ? { attachment: e.attachment } : undefined })} noValidate className="space-y-9">
              <Step n={1} title={t("support.report.step1")}>
                <div className="grid gap-5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                  <Field name="category" label={t("support.f.category")} error={e.category}>
                    {(a) => (
                      <select {...a} className={inputCls} value={v.category ?? ""} onChange={(x) => f.set("category", x.target.value)}>
                        <option value="" disabled>{t("support.f.categoryPick")}</option>
                        {CATEGORIES.report.map((c) => <option key={c} value={c}>{t(`support.cat.report.${c}`)}</option>)}
                      </select>
                    )}
                  </Field>
                  <Field name="subject" label={t("support.report.titleLabel")} error={e.subject}>
                    {(a) => <input {...a} className={inputCls} value={v.subject ?? ""} maxLength={LIMITS.subjectMax} placeholder={t("support.report.titlePh")} onChange={(x) => f.set("subject", x.target.value)} />}
                  </Field>
                </div>
                <Field name="message" label={t("support.report.description")} error={e.message} count={(v.message ?? "").length} max={LIMITS.messageMax}>
                  {(a) => <textarea {...a} rows={4} className={`${inputCls} resize-y`} value={v.message ?? ""} maxLength={LIMITS.messageMax} placeholder={t("support.report.descriptionPh")} onChange={(x) => f.set("message", x.target.value)} />}
                </Field>
              </Step>

              <Step n={2} title={t("support.report.step2")}>
                <Field name="steps" label={t("support.report.steps")} optional error={e.steps}>
                  {(a) => <textarea {...a} rows={4} className={`${inputCls} resize-y font-mono text-sm`} value={v.steps ?? ""} maxLength={LIMITS.detailMax} placeholder={t("support.report.stepsPh")} onChange={(x) => f.set("steps", x.target.value)} />}
                </Field>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field name="expected" label={t("support.report.expected")} optional error={e.expected} className="rounded-2xl border-l-4 border-emerald-400 bg-emerald-50/50 p-4">
                    {(a) => <textarea {...a} rows={3} className={`${inputCls} resize-y`} value={v.expected ?? ""} maxLength={LIMITS.detailMax} placeholder={t("support.report.expectedPh")} onChange={(x) => f.set("expected", x.target.value)} />}
                  </Field>
                  <Field name="actual" label={t("support.report.actual")} optional error={e.actual} className="rounded-2xl border-l-4 border-red-400 bg-red-50/50 p-4">
                    {(a) => <textarea {...a} rows={3} className={`${inputCls} resize-y`} value={v.actual ?? ""} maxLength={LIMITS.detailMax} placeholder={t("support.report.actualPh")} onChange={(x) => f.set("actual", x.target.value)} />}
                  </Field>
                </div>
              </Step>

              <Step n={3} title={t("support.report.step3")}>
                <Field name="pageUrl" label={t("support.report.pageUrl")} optional hint={t("support.report.pageUrlHint")} error={e.pageUrl}>
                  {(a) => <input {...a} type="url" inputMode="url" className={`${inputCls} font-mono text-sm`} value={pageUrl} maxLength={LIMITS.pageUrlMax} placeholder="https://…" onChange={(x) => f.set("pageUrl", x.target.value)} />}
                </Field>

                <div>
                  <p id={`${fieldId("attachment")}-label`} className="text-sm font-semibold">{t("support.report.attachment")} <span className="font-normal text-mute">({t("support.f.optional")})</span></p>
                  <p id={`${fieldId("attachment")}-hint`} className="mt-0.5 text-[13px] text-mute">{t("support.report.attachHelp")}</p>
                  {file ? (
                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      {preview
                        // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, next/image can't optimise it
                        ? <img src={preview} alt={t("support.report.attachPreview")} className="h-16 w-24 flex-none rounded-lg object-cover ring-1 ring-slate-200" />
                        : <span className="grid h-16 w-16 flex-none place-items-center rounded-lg bg-white text-brand ring-1 ring-slate-200"><Icon.file /></span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{file.name}</span>
                        <span className="block text-[13px] text-mute">{formatSize(file.size)}</span>
                      </span>
                      <button type="button" onClick={() => pick(null)} className="inline-flex flex-none items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">
                        <Icon.x /><span>{t("support.report.attachRemove")}</span>
                      </button>
                    </div>
                  ) : (
                    <label onDragOver={(ev) => { ev.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
                      className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition focus-within:ring-4 focus-within:ring-brand/20 ${dragging ? "border-brand bg-brand/5" : e.attachment ? "border-red-400 bg-red-50/40" : "border-slate-300 hover:border-brand hover:bg-slate-50"}`}>
                      <span className="text-brand"><Icon.upload /></span>
                      <span className="font-semibold text-brand">{t("support.report.attachChoose")}</span>
                      <span className="text-[13px] text-mute">{t("support.report.attachDrop")}</span>
                      <input ref={inputRef} id={fieldId("attachment")} type="file" accept={ATTACHMENT.accept} className="sr-only"
                        aria-labelledby={`${fieldId("attachment")}-label`} aria-invalid={!!e.attachment}
                        aria-describedby={[`${fieldId("attachment")}-hint`, e.attachment && `${fieldId("attachment")}-err`].filter(Boolean).join(" ")}
                        onChange={(ev) => pick(ev.target.files?.[0] ?? null)} />
                    </label>
                  )}
                  {e.attachment && <p id={`${fieldId("attachment")}-err`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-red-600"><Icon.alert />{errorText("attachment", e.attachment)}</p>}
                </div>

                <Field name="email" label={t("support.f.email")} optional hint={t("support.report.emailHint")} error={e.email}>
                  {(a) => <input {...a} type="email" inputMode="email" className={inputCls} value={v.email ?? ""} maxLength={LIMITS.email} autoComplete="email" placeholder={t("support.f.emailPh")} onChange={(x) => f.set("email", x.target.value)} />}
                </Field>
              </Step>

              <ErrorBanner message={f.status.state === "error" ? f.status.message : undefined} />
              <SubmitButton sending={f.sending} label={t("support.report.send")} className="w-full sm:w-auto" />
            </form>
          )}
        </section>

        <aside className="self-start rounded-3xl bg-white/70 p-6 ring-1 ring-slate-200 lg:sticky lg:top-24" aria-labelledby="report-tips">
          <h2 id="report-tips" className="flex items-center gap-2 font-extrabold"><span className="text-amber-500"><Icon.bulb /></span>{t("support.report.tipsTitle")}</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden="true" />{t(`support.report.tip${n}`)}</li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-4 flex items-center gap-3 text-lg font-extrabold">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-sm text-white" aria-hidden="true">{n}</span>{title}
      </legend>
      {children}
    </fieldset>
  );
}
