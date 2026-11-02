"use client";

import { useState } from "react";
import { GameDialog, primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import { authenticate, signOut, useAccount } from "@/lib/account";

/** Optional account control. Nothing in the app requires signing in. */
export default function AccountMenu() {
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const message = await authenticate(mode, email, password);
    setBusy(false);
    if (message) return setError(message);
    setPassword("");
    setOpen(false);
  }

  if (account.status === "loading") return <span className="h-9 w-24" aria-hidden="true" />;
  if (account.status === "user") {
    return <div className="flex items-center gap-2 text-xs">
      <span className="hidden max-w-[160px] truncate rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-brand sm:inline" title={account.email}>☁ {account.email}</span>
      <button type="button" className={`${secondaryBtn} !px-3 !py-1.5 !text-xs`} onClick={() => void signOut()}>Sign out</button>
    </div>;
  }
  return <>
    <button type="button" className={`${primaryBtn} !px-4 !py-2 !text-xs`} onClick={() => { setMode("login"); setError(null); setOpen(true); }}>Sign in</button>
    {open && <GameDialog title={mode === "login" ? "Sign in" : "Create account"} subtitle="Optional — sync your scores and progress across devices." icon="☁️" onEscape={() => setOpen(false)}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-mute">Email
          <input data-autofocus type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm normal-case text-navy" />
        </label>
        <label className="block text-xs font-bold uppercase tracking-wider text-mute">Password
          <input type="password" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm normal-case text-navy" />
          {mode === "signup" && <span className="mt-1 block text-[11px] font-normal normal-case">At least 8 characters.</span>}
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-bad">{error}</p>}
        <button type="submit" disabled={busy} className={`${primaryBtn} w-full disabled:opacity-60`}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        <p className="text-center text-sm text-mute">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button type="button" className="font-bold text-brand underline" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}>{mode === "login" ? "Create an account" : "Sign in"}</button>
        </p>
        <p className="text-center text-xs text-mute">Your current progress on this device is kept and merged into your account.</p>
        <button type="button" className="w-full text-center text-xs font-semibold text-mute underline" onClick={() => setOpen(false)}>Continue without an account</button>
      </form>
    </GameDialog>}
  </>;
}
