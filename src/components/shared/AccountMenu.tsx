"use client";

import { useEffect, useState } from "react";
import OtpInput from "@/components/shared/OtpInput";
import { GameDialog, primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import { useLocale } from "@/components/shared/LocaleProvider";
import { authenticate, resendVerification, signOut, useAccount, verifyEmailCode } from "@/lib/account";

/** Optional account control. Nothing in the app requires signing in. */
export default function AccountMenu() {
  const account = useAccount();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
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
  const [now, setNow] = useState(() => Date.now());
  const [info, setInfo] = useState<string | null>(null);

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
  function startCountdown(seconds = 600) {
    const t = Date.now();
    setNow(t);
    setExpiresAt(t + seconds * 1000);
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
    setInfo(result.devCode ? "The email could not be delivered (dev mode). Use the code below." : "Sent! Check your inbox (and your spam folder).");
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
    setInfo("Email verified! Sign in with your password to continue.");
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
    return <div className="flex items-center gap-2 text-xs">
      <span className="hidden max-w-[160px] truncate rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-brand sm:inline" title={account.email}>☁ {account.name || account.email}</span>
      <button type="button" className={`${secondaryBtn} whitespace-nowrap !px-3 !py-1.5 !text-xs`} onClick={() => void signOut()}>{t("auth.signOut")}</button>
    </div>;
  }
  return <>
    <button type="button" className={`${primaryBtn} whitespace-nowrap !px-4 !py-2 !text-xs`} onClick={() => { setMode("login"); setError(null); setOpen(true); }}>{t("auth.signIn")}</button>
    {open && pending && <GameDialog title="Enter your code" subtitle={pending.state === "sent" ? `We emailed a 6-digit code to ${pending.email}.` : pending.state === "unverified" ? `${pending.email} isn't verified yet.` : `Your account was created, but we couldn't email ${pending.email}.`} logo onEscape={close}>
      <form onSubmit={confirmCode} className="space-y-3">
        <p className="text-center text-sm text-mute">{pending.state === "sent" ? "Enter the code to verify your email, then sign in." : "Press “Send code” to get a new 6-digit code."}</p>
        <OtpInput autoFocus value={code} onChange={setCode} disabled={busy || expired} />
        {secondsLeft !== null && <p role="timer" aria-live="off" className={`text-center text-sm font-semibold ${expired ? "text-bad" : secondsLeft <= 60 ? "text-amber-700" : "text-mute"}`}>{expired ? "This code has expired. Request a new one." : `Code expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`}</p>}
        {devCode && <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-800">Dev only: email not delivered. Your code is <button type="button" className="font-extrabold underline" onClick={() => setCode(devCode)}>{devCode}</button> (click to fill)</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-bad">{error}</p>}
        {info && <p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{info}</p>}
        <button type="submit" disabled={busy || expired || code.length !== 6} className={`${primaryBtn} w-full disabled:opacity-60`}>{busy ? "Checking…" : "Verify"}</button>
        <button type="button" disabled={busy || cooldown > 0} onClick={() => void resend()} className={`${secondaryBtn} w-full disabled:opacity-60`}>{cooldown > 0 ? `Resend code (${cooldown}s)` : pending.state === "sent" ? "Resend code" : "Send code"}</button>
        <button type="button" className="w-full text-center text-xs font-semibold text-mute underline" onClick={() => { setPending(null); setCode(""); setDevCode(null); setExpiresAt(null); setMode("login"); setError(null); setInfo(null); }}>Back to sign in</button>
        <button type="button" className="w-full text-center text-xs font-semibold text-mute underline" onClick={close}>Continue without an account</button>
      </form>
    </GameDialog>}
    {open && !pending && <GameDialog title={mode === "login" ? "Sign in" : "Create account"} subtitle="Optional — sync your scores and progress across devices." logo onEscape={close}>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && <label className="block text-xs font-bold uppercase tracking-wider text-mute">Name
          <input data-autofocus type="text" required maxLength={50} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm normal-case text-navy" />
        </label>}
        <label className="block text-xs font-bold uppercase tracking-wider text-mute">Email
          <input data-autofocus={mode === "login" || undefined} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm normal-case text-navy" />
        </label>
        <label className="block text-xs font-bold uppercase tracking-wider text-mute">Password
          <input type="password" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm normal-case text-navy" />
          {mode === "signup" && <span className="mt-1 block text-[11px] font-normal normal-case">At least 8 characters. We&apos;ll email you a 6-digit code to verify your address.</span>}
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-bad">{error}</p>}
        {info && <p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{info}</p>}
        <button type="submit" disabled={busy} className={`${primaryBtn} w-full disabled:opacity-60`}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        <p className="text-center text-sm text-mute">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button type="button" className="font-bold text-brand underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setInfo(null); }}>{mode === "login" ? "Create an account" : "Sign in"}</button>
        </p>
        <p className="text-center text-xs text-mute">Your current progress on this device is kept and merged into your account.</p>
        <button type="button" className="w-full text-center text-xs font-semibold text-mute underline" onClick={close}>Continue without an account</button>
      </form>
    </GameDialog>}
  </>;
}
