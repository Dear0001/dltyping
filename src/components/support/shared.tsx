"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";
import { LIMITS, validateSupport, type ErrCode, type FieldErrors, type FieldName, type SupportFields, type SupportKind } from "@/lib/support";

export const inputCls =
  "mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-navy shadow-sm transition placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/15";

export const fieldId = (name: FieldName) => `sf-${name}`;

/** Translates a field error, filling in the limit that applies to that field. */
export function useErrorText() {
  const { t } = useLocale();
  return (field: FieldName, code: ErrCode) => {
    const min = field === "subject" ? LIMITS.subjectMin : LIMITS.messageMin;
    const max = field === "subject" ? LIMITS.subjectMax : field === "name" ? LIMITS.name : field === "message" ? LIMITS.messageMax : field === "email" ? LIMITS.email : LIMITS.detailMax;
    return t(`support.err.${code}`, { min, max });
  };
}

type A11y = { id: string; "aria-invalid": boolean; "aria-describedby"?: string; "aria-required"?: boolean };

/** Label + hint + error + optional character counter around one input. Children get the ids/aria to spread on the control. */
export function Field({ name, label, optional, hint, error, count, max, className = "", children }: {
  name: FieldName; label: string; optional?: boolean; hint?: string; error?: ErrCode; count?: number; max?: number; className?: string;
  children: (a11y: A11y) => ReactNode;
}) {
  const { t } = useLocale();
  const errorText = useErrorText();
  const id = fieldId(name);
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-semibold text-navy">
        <span>{label}{optional ? <span className="ml-1.5 font-normal text-mute">({t("support.f.optional")})</span> : <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}</span>
        {max !== undefined && count !== undefined && <span className={`text-xs font-normal tabular-nums ${count > max ? "text-red-600" : "text-mute"}`}>{t("support.count", { n: count, max })}</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="mt-0.5 text-[13px] text-mute">{hint}</p>}
      {children({ id, "aria-invalid": !!error, "aria-describedby": describedBy, ...(!optional && { "aria-required": true }) })}
      {error && <p id={`${id}-err`} className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-red-600"><Icon.alert />{errorText(name, error)}</p>}
    </div>
  );
}

type Status = { state: "idle" | "sending" | "error" | "done"; message?: string; reference?: string };

/**
 * Form state + submission to /api/support. Validates with the same rules as the server, sends multipart form data,
 * and only reports success after the API confirms the message was stored.
 */
export function useSupportForm(kind: SupportKind, initial: SupportFields = {}) {
  const { t } = useLocale();
  const [values, setValues] = useState<SupportFields>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const set = (name: keyof SupportFields, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const setFieldError = (name: FieldName, code: ErrCode | undefined) => setErrors((e) => ({ ...e, [name]: code }));

  const showErrors = (errs: FieldErrors) => {
    setErrors(errs);
    setStatus({ state: "error", message: t("support.err.fix") });
    const first = (Object.keys(errs) as FieldName[]).find((k) => errs[k]);
    if (first) requestAnimationFrame(() => document.getElementById(fieldId(first))?.focus());
  };

  const submit = async (e: FormEvent, extra: { fields?: SupportFields; attachment?: File | null; clientErrors?: FieldErrors } = {}) => {
    e.preventDefault();
    if (status.state === "sending") return;
    const fields = { ...values, ...extra.fields };
    const check = validateSupport(kind, fields);
    const errs = { ...("errors" in check ? check.errors : {}), ...extra.clientErrors };
    if (Object.values(errs).some(Boolean)) return showErrors(errs);

    setStatus({ state: "sending" });
    const body = new FormData();
    body.set("kind", kind);
    for (const [k, v] of Object.entries(fields)) if (v) body.set(k, v);
    if (extra.attachment) body.set("attachment", extra.attachment);
    try {
      const res = await fetch("/api/support", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; reference?: string; error?: string; errors?: FieldErrors } | null;
      if (res.ok && data?.ok) {
        setStatus({ state: "done", reference: typeof data.reference === "string" ? data.reference : undefined });
        return;
      }
      if (data?.errors && Object.keys(data.errors).length) return showErrors(data.errors);
      setStatus({ state: "error", message: t(`support.err.${data?.error === "rate" ? "rate" : "server"}`) });
    } catch {
      setStatus({ state: "error", message: t("support.err.network") });
    }
  };

  const reset = () => {
    setValues(initial);
    setErrors({});
    setStatus({ state: "idle" });
  };

  return { values, errors, status, set, setFieldError, submit, reset, sending: status.state === "sending" };
}

/** Page-level error banner (announced to screen readers). */
export function ErrorBanner({ message }: { message?: string }) {
  const { t } = useLocale();
  if (!message) return null;
  return (
    <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
      <span className="mt-0.5 flex-none"><Icon.alert /></span>
      <p><strong className="block font-semibold">{t("support.err.title")}</strong>{message}</p>
    </div>
  );
}

export function SubmitButton({ sending, label, className = "" }: { sending: boolean; label: string; className?: string }) {
  const { t } = useLocale();
  return (
    <button type="submit" disabled={sending} aria-busy={sending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-[15px] font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:cursor-wait disabled:opacity-70 ${className}`}>
      {sending ? <><Spinner />{t("support.sending")}</> : <>{label}<span aria-hidden="true">→</span></>}
    </button>
  );
}

const Spinner = () => <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />;

/** Success panel shown only after the API confirmed the save. Takes focus so screen readers announce it. */
export function SuccessPanel({ title, body, action, onAgain, children }: { title: string; body: string; action: string; onAgain: () => void; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div role="status" tabIndex={-1} ref={ref} className="flex flex-col items-center px-2 py-8 text-center outline-none">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Icon.check /></span>
      <h2 className="mt-5 text-2xl font-extrabold text-navy">{title}</h2>
      <p className="mt-2 max-w-sm text-mute">{body}</p>
      {children}
      <button type="button" onClick={onAgain} className="mt-6 font-semibold text-brand hover:underline">{action}</button>
    </div>
  );
}

const PAGES: { kind: SupportKind; href: string }[] = [
  { kind: "contact", href: "/support/contact" },
  { kind: "feedback", href: "/support/feedback" },
  { kind: "report", href: "/support/report" },
];

/** Small pill switcher between the three support pages. */
export function SupportNav({ current, tone = "light" }: { current: SupportKind; tone?: "light" | "dark" }) {
  const { t } = useLocale();
  const base = tone === "dark" ? "text-white/75 hover:bg-white/10 hover:text-white" : "text-mute hover:bg-white hover:text-navy";
  const active = tone === "dark" ? "bg-white text-navy" : "bg-navy text-white";
  return (
    <nav aria-label={t("support.nav.label")} className={`inline-flex max-w-full flex-wrap gap-1 rounded-full p-1 ${tone === "dark" ? "bg-white/10" : "bg-navy/5"}`}>
      {PAGES.map((p) => (
        <Link key={p.kind} href={p.href} aria-current={p.kind === current ? "page" : undefined}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${p.kind === current ? active : base}`}>
          {t(`support.nav.${p.kind}`)}
        </Link>
      ))}
    </nav>
  );
}

const svg = (children: ReactNode, size = 18) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export const Icon = {
  alert: () => svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>, 16),
  check: () => svg(<path d="M5 12.5l4.5 4.5L19 7.5" />, 30),
  mail: () => svg(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></>, 22),
  linkedin: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.6h.05c.53-1 1.84-2.05 3.78-2.05 4.05 0 4.8 2.66 4.8 6.12v5.33h-4v-4.73c0-1.13-.02-2.58-1.57-2.58-1.58 0-1.82 1.23-1.82 2.5v4.81h-4z" /></svg>
  ),
  github: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 2.25a9.75 9.75 0 0 0-3.08 19c.49.09.67-.21.67-.47v-1.66c-2.71.59-3.28-1.31-3.28-1.31-.44-1.13-1.08-1.43-1.08-1.43-.89-.6.07-.59.07-.59.98.07 1.5 1 1.5 1 .87 1.5 2.29 1.07 2.85.82.09-.63.34-1.07.62-1.31-2.17-.25-4.44-1.08-4.44-4.82 0-1.07.38-1.94 1-2.62-.1-.25-.43-1.24.1-2.58 0 0 .82-.26 2.68 1a9.3 9.3 0 0 1 4.88 0c1.86-1.26 2.68-1 2.68-1 .53 1.34.2 2.33.1 2.58.62.68 1 1.55 1 2.62 0 3.75-2.28 4.57-4.45 4.81.35.3.66.9.66 1.81v2.68c0 .26.18.57.68.47A9.75 9.75 0 0 0 12 2.25z" /></svg>
  ),
  external: () => svg(<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />, 16),
  star: (filled: boolean) => (
    <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" /></svg>
  ),
  upload: () => svg(<><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" /><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" /></>, 26),
  file: () => svg(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></>, 22),
  x: () => svg(<path d="M6 6l12 12M18 6L6 18" />, 16),
  bulb: () => svg(<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" /></>, 20),
};
