"use client";

import { useEffect, useState } from "react";
import { GameDialog, primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import { useLocale } from "@/components/shared/LocaleProvider";
import { authenticate, resendVerification, signOut, useAccount } from "@/lib/account";

/** Optional account control. Nothing in the app requires signing in. */
export default function AccountMenu() {
  const account = useAccount();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Set once an account exists but its email is not confirmed yet: the dialog then shows "check your email".
  const [pending, setPending] = useState<{ email: string; state: "sent" | "not-sent" | "unverified" } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  function close() {
    setOpen(false);
    setPending(null);
    setInfo(null);
    setError(null);
  }

  async function resend() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const message = await resendVerification(pending.email);
    setBusy(false);
    if (message) return setError(message);
    setInfo("Sent! Check your inbox (and your spam folder).");
    setCooldown(30);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await authenticate(mode, email, password);
    setBusy(false);
    setPassword("");
    if (result.verify) {
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
      <span className="hidden max-w-[160px] truncate rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-brand sm:inline" title={account.email}>☁ {account.email}</span>
      <button type="button" className={`${secondaryBtn} whitespace-nowrap !px-3 !py-1.5 !text-xs`} onClick={() => void signOut()}>{t("auth.signOut")}</button>
    </div>;
  }
  return <>
    <button type="button" className={`${primaryBtn} whitespace-nowrap !px-4 !py-2 !text-xs`} onClick={() => { setMode("login"); setError(null); setOpen(true); }}>{t("auth.signIn")}</button>
    {open && pending && <GameDialog title="Check your email" subtitle={pending.state === "sent" ? `We sent a verification link to ${pending.email}.` : pending.state === "unverified" ? `${pending.email} isn't verified yet.` : `Your account was created, but we couldn't email ${pending.email}.`} icon="📧" onEscape={close}>
      <div className="space-y-3">
        <p className="text-center text-sm text-mute">{pending.state === "not-sent" ? "Press the button below to try sending it again." : "Click the link in the email to activate your account, then come back and sign in. The link works for 24 hours."}</p>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-bad">{error}</p>}
        {info && <p role="status" className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{info}</p>}
        <button type="button" data-autofocus disabled={busy || cooldown > 0} onClick={() => void resend()} className={`${primaryBtn} w-full disabled:opacity-60`}>{busy ? "Sending…" : cooldown > 0 ? `Resend email (${cooldown}s)` : pending.state === "not-sent" ? "Send verification email" : "Resend email"}</button>
        <button type="button" className={`${secondaryBtn} w-full`} onClick={() => { setPending(null); setMode("login"); setError(null); setInfo(null); }}>Back to sign in</button>
        <button type="button" className="w-full text-center text-xs font-semibold text-mute underline" onClick={close}>Continue without an account</button>
      </div>
    </GameDialog>}
    {open && !pending && <GameDialog title={mode === "login" ? "Sign in" : "Create account"} subtitle="Optional — sync your scores and progress across devices." icon="☁️" onEscape={close}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-mute">Email
          <input data-autofocus type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm normal-case text-navy" />
        </label>
        <label className="block text-xs font-bold uppercase tracking-wider text-mute">Password
          <input type="password" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm normal-case text-navy" />
          {mode === "signup" && <span className="mt-1 block text-[11px] font-normal normal-case">At least 8 characters. We&apos;ll email you a link to verify your address.</span>}
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-bad">{error}</p>}
        <button type="submit" disabled={busy} className={`${primaryBtn} w-full disabled:opacity-60`}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        <p className="text-center text-sm text-mute">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button type="button" className="font-bold text-brand underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}>{mode === "login" ? "Create an account" : "Sign in"}</button>
        </p>
        <p className="text-center text-xs text-mute">Your current progress on this device is kept and merged into your account.</p>
        <button type="button" className="w-full text-center text-xs font-semibold text-mute underline" onClick={close}>Continue without an account</button>
      </form>
    </GameDialog>}
  </>;
}
