"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import OtpInput from "@/components/shared/OtpInput";
import { GameDialog, primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import { useLocale } from "@/components/shared/LocaleProvider";
import { authenticate, resendVerification, signOut, useAccount, verifyEmailCode } from "@/lib/account";

/** Optional account control. Nothing in the app requires signing in. */
export default function AccountMenu() {
  const account = useAccount();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenuOpen(false); menuRef.current?.querySelector<HTMLElement>(".acct-btn")?.focus(); } };
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Set once an account exists but its email is not confirmed yet: the dialog then shows "check your email".
  const [pending, setPending] = useState<{ email: string; state: "sent" | "not-sent" | "unverified" } | null>(null);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null); // development only: shown when the email could not be delivered
  const [cooldown, setCooldown] = useState(0);
  const [expiresAt, setExpiresAt] = useState<number | null>(null); // when the emailed code stops working (ms)
  const [now, setNow] = useState(0); // set only by startCountdown and the interval, never during render
  const [info, setInfo] = useState<string | null>(null);
  const [confirmOut, setConfirmOut] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);
  // Server messages arrive in English; show the Khmer text when we have it.
  const errText = (message: string) => {
    const key = `autherr.${message.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).replace(/-$/, "")}`;
    const text = t(key);
    return text === key ? message : text;
  };
  function startCountdown(seconds = 600) {
    const started = Date.now();
    setNow(started);
    setExpiresAt(started + seconds * 1000);
  }
  const secondsLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : null;
  const expired = secondsLeft === 0;

  function close() {
    setOpen(false);
    setPending(null);
    setCode("");
    setDevCode(null);
    setExpiresAt(null);
    setInfo(null);
    setError(null);
  }

  async function resend() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const result = await resendVerification(pending.email);
    setBusy(false);
    if (result.error) return setError(result.error);
    setDevCode(result.devCode ?? null);
    setCode("");
    startCountdown(result.expiresIn);
    setInfo(t(result.devCode ? "auth.devNotDelivered" : "auth.sent"));
    setCooldown(30);
  }

  async function confirmCode(event: React.FormEvent) {
    event.preventDefault();
    if (!pending) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const message = await verifyEmailCode(pending.email, code);
    setBusy(false);
    if (message) return setError(message);
    // Verified: continue to sign-in with the email filled in.
    setEmail(pending.email);
    setPending(null);
    setCode("");
    setDevCode(null);
    setExpiresAt(null);
    setMode("login");
    setInfo(t("auth.verified"));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const result = await authenticate(mode, email, password, name);
    setBusy(false);
    setPassword("");
    if (result.verify) {
      setDevCode(result.devCode ?? null);
      setCode("");
      if (result.verify === "unverified") setExpiresAt(null); else startCountdown(result.expiresIn);
      setPending({ email: email.trim().toLowerCase(), state: result.verify });
      if (result.verify === "sent") setCooldown(30);
      return;
    }
    if (result.error) return setError(result.error);
    close();
  }

  if (account.status === "loading") return <span className="h-9 w-24" aria-hidden="true" />;
  if (account.status === "user") {
    const label = account.name || account.email;
    return <div className="acct" ref={menuRef}>
      <button type="button" className="acct-btn" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} title={account.email}>
        <span className="acct-avatar" aria-hidden="true">{(label || "?").charAt(0).toUpperCase()}</span>
        <span className="acct-name">{label}</span>
        <span className="acct-caret" aria-hidden="true">⌄</span>
      </button>
      {menuOpen && <div className="acct-menu" role="menu">
        <div className="acct-info"><strong>{account.name || t("auth.signedIn")}</strong><small>{account.email}</small></div>
        <Link href="/dashboard" role="menuitem" className="acct-item" onClick={() => setMenuOpen(false)}>{t("nav.dashboard")}</Link>
        <Link href="/progress" role="menuitem" className="acct-item" onClick={() => setMenuOpen(false)}>{t("nav.progress")}</Link>
        <div className="acct-sep" role="separator" />
        <button type="button" role="menuitem" className="acct-item" onClick={() => { setMenuOpen(false); setConfirmOut(true); }}>{t("auth.signOut")}</button>
      </div>}
      {confirmOut && <GameDialog title={t("auth.signOutTitle")} subtitle={t("auth.signOutBody")} icon="👋" onEscape={() => setConfirmOut(false)}>
        <div className="flex flex-col gap-2">
          <button data-autofocus type="button" className={primaryBtn} onClick={() => { setConfirmOut(false); void signOut(); }}>{t("auth.signOut")}</button>
          <button type="button" className={secondaryBtn} onClick={() => setConfirmOut(false)}>{t("auth.stay")}</button>
        </div>
      </GameDialog>}
    </div>;
  }
  return <>
    <button type="button" className={`${primaryBtn} whitespace-nowrap !px-4 !py-2 !text-xs`} onClick={() => { setMode("login"); setError(null); setOpen(true); }}>{t("auth.signIn")}</button>
    {open && pending && <GameDialog title={t("auth.enterCode")} subtitle={pending.state === "sent" ? t("auth.emailedCode", { email: pending.email }) : pending.state === "unverified" ? t("auth.notVerified", { email: pending.email }) : t("auth.couldNotEmail", { email: pending.email })} logo onEscape={close}>
      <form onSubmit={confirmCode} className="space-y-3">
        <p className="text-center text-sm text-mute">{t(pending.state === "sent" ? "auth.verifyThenSignIn" : "auth.pressSend")}</p>
        <OtpInput autoFocus value={code} onChange={setCode} disabled={busy || expired} />
        {secondsLeft !== null && <p role="timer" aria-live="off" className={`text-center text-sm font-semibold ${expired ? "text-bad" : secondsLeft <= 60 ? "text-amber-700" : "text-mute"}`}>{expired ? t("auth.codeExpired") : t("auth.codeExpires", { time: `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}` })}</p>}
        {devCode && <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-800">{t("auth.devOnly")}<button type="button" className="font-extrabold underline" onClick={() => setCode(devCode)}>{devCode}</button>{t("auth.clickFill")}</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-bad">{errText(error)}</p>}
        {info && <p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{info}</p>}
        <button type="submit" disabled={busy || expired || code.length !== 6} className={`${primaryBtn} w-full disabled:opacity-60`}>{busy ? t("auth.checking") : t("auth.verify")}</button>
        <button type="button" disabled={busy || cooldown > 0} onClick={() => void resend()} className={`${secondaryBtn} w-full disabled:opacity-60`}>{cooldown > 0 ? t("auth.resendIn", { n: cooldown }) : t(pending.state === "sent" ? "auth.resend" : "auth.sendCode")}</button>
        <button type="button" className="w-full text-center text-xs font-semibold text-mute underline" onClick={() => { setPending(null); setCode(""); setDevCode(null); setExpiresAt(null); setMode("login"); setError(null); setInfo(null); }}>{t("auth.backToSignIn")}</button>
        <button type="button" className="w-full text-center text-xs font-semibold text-mute underline" onClick={close}>{t("auth.continueGuest")}</button>
      </form>
    </GameDialog>}
    {open && !pending && <GameDialog title={t(mode === "login" ? "auth.titleLogin" : "auth.titleSignup")} subtitle={t("auth.optional")} logo onEscape={close}>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && <label className="block text-xs font-bold uppercase tracking-wider text-mute">{t("auth.name")}
          <input data-autofocus type="text" required maxLength={50} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm normal-case text-navy" />
        </label>}
        <label className="block text-xs font-bold uppercase tracking-wider text-mute">{t("auth.email")}
          <input data-autofocus={mode === "login" || undefined} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm normal-case text-navy" />
        </label>
        <label className="block text-xs font-bold uppercase tracking-wider text-mute">{t("auth.password")}
          <input type="password" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm normal-case text-navy" />
          {mode === "signup" && <span className="mt-1 block text-[11px] font-normal normal-case">{t("auth.passwordHint")}</span>}
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-bad">{errText(error)}</p>}
        {info && <p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{info}</p>}
        <button type="submit" disabled={busy} className={`${primaryBtn} w-full disabled:opacity-60`}>{busy ? t("auth.wait") : t(mode === "login" ? "auth.titleLogin" : "auth.titleSignup")}</button>
        <p className="text-center text-sm text-mute">
          {t(mode === "login" ? "auth.newHere" : "auth.haveAccount")}
          <button type="button" className="font-bold text-brand underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setInfo(null); }}>{t(mode === "login" ? "auth.createAnAccount" : "auth.titleLogin")}</button>
        </p>
        <p className="text-center text-xs text-mute">{t("auth.progressMerged")}</p>
        <button type="button" className="w-full text-center text-xs font-semibold text-mute underline" onClick={close}>{t("auth.continueGuest")}</button>
      </form>
    </GameDialog>}
  </>;
}
