"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type State = { status: "working" } | { status: "ok"; email: string } | { status: "error"; message: string };

/** Opened from the link in the verification email. The token is submitted by script (not on page load of the URL itself), so mail scanners that only fetch the link can't use it up. */
export default function VerifyEmail() {
  const [state, setState] = useState<State>({ status: "working" });
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    let live = true;
    const result: Promise<State> = !token
      ? Promise.resolve({ status: "error", message: "This link is incomplete. Open the link from your email again." })
      : fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
          .then(async (res): Promise<State> => {
            const data = (await res.json().catch(() => ({}))) as { error?: string; email?: string };
            return res.ok ? { status: "ok", email: data.email ?? "" } : { status: "error", message: data.error ?? "Could not verify this link." };
          })
          .catch((): State => ({ status: "error", message: "Network error. Check your connection and reload this page." }));
    void result.then((next) => { if (live) setState(next); });
    return () => { live = false; };
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 text-navy">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {state.status === "working" && <><div className="text-5xl" aria-hidden="true">⏳</div><h1 className="mt-3 text-2xl font-extrabold">Verifying your email…</h1></>}
        {state.status === "ok" && <>
          <div className="text-5xl" aria-hidden="true">✅</div>
          <h1 className="mt-3 text-2xl font-extrabold">Email verified!</h1>
          <p className="mt-2 text-mute">{state.email ? `${state.email} is confirmed. ` : ""}You can now sign in with your email and password.</p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white">Go to DL Typing</Link>
        </>}
        {state.status === "error" && <>
          <div className="text-5xl" aria-hidden="true">⚠️</div>
          <h1 className="mt-3 text-2xl font-extrabold">We couldn&apos;t verify that link</h1>
          <p role="alert" className="mt-2 text-mute">{state.message}</p>
          <p className="mt-2 text-sm text-mute">Sign in with your email and password and we&apos;ll offer to send a new one.</p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white">Back to DL Typing</Link>
        </>}
      </div>
    </main>
  );
}
