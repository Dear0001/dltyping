"use client";

// Client account store: who is signed in, plus sign-in / sign-up / sign-out actions.
import { useSyncExternalStore } from "react";
import { ACCOUNT_HINT_KEY } from "@/lib/prepaint";
import { clearLocalProgress, getDeviceId, setSyncAccount, syncProgress } from "@/lib/sync";

export type Account = { status: "loading" | "anon" | "user"; email?: string; name?: string | null; /** Granted by the server for this email (see src/lib/perks.ts). */ perks?: { allPets?: boolean } };
let account: Account = { status: "loading" };
const listeners = new Set<() => void>();
const LOADING: Account = { status: "loading" };

function set(next: Account) {
  account = next;
  if (next.status !== "loading") rememberStatus(next.status);
  setSyncAccount(next.status === "user");
  listeners.forEach((l) => l());
}

/** Saves a first-paint hint (html[data-acct]) so the navbar is laid out for the right state on the next refresh. */
function rememberStatus(status: "anon" | "user") {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-acct", status);
  try { localStorage.setItem(ACCOUNT_HINT_KEY, status); } catch { /* storage unavailable: only the hint is lost */ }
}

export function useAccount(): Account {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => account, () => LOADING);
}

export async function refreshAccount() {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const data = (await res.json()) as { user: { email: string; name?: string | null; perks?: { allPets?: boolean } } | null };
    set(data.user ? { status: "user", email: data.user.email, name: data.user.name, perks: data.user.perks } : { status: "anon" });
  } catch {
    if (account.status === "loading") set({ status: "anon" });
  }
}

/**
 * `error` is a message to show, or null on success. `verify` means the account exists but its email is not confirmed yet:
 * "sent" = a link was just emailed, "not-sent" = it could not be emailed, "unverified" = tried to sign in before confirming.
 */
export type AuthResult = { error: string | null; verify?: "sent" | "not-sent" | "unverified"; /** Development only: the verification code, when the email could not be delivered. */ devCode?: string; /** Seconds until the emailed code expires. */ expiresIn?: number };

export async function authenticate(mode: "login" | "signup", email: string, password: string, name?: string): Promise<AuthResult> {
  try {
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, name, deviceId: getDeviceId() }) });
    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string; user?: { email: string; name?: string | null }; pendingVerification?: boolean; emailSent?: boolean; devCode?: string; expiresIn?: number };
    if (res.ok && data.pendingVerification) return { error: null, verify: data.emailSent === false ? "not-sent" : "sent", devCode: data.devCode, expiresIn: data.expiresIn };
    if (res.status === 403 && data.code === "unverified") return { error: data.error ?? "Please verify your email first.", verify: "unverified" };
    if (!res.ok || !data.user) return { error: data.error ?? "Something went wrong. Please try again." };
    set({ status: "user", email: data.user.email, name: data.user.name });
    void refreshAccount(); // pick up account perks (login responses carry only the email)
    await syncProgress(true); // merge account progress into this device
    return { error: null };
  } catch {
    return { error: "Network error. Check your connection and try again." };
  }
}

/** Asks for a fresh verification code. `error` is a message, or null on success; `devCode` is development-only (see AuthResult). */
export async function resendVerification(email: string): Promise<{ error: string | null; devCode?: string; expiresIn?: number }> {
  try {
    const res = await fetch("/api/auth/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = (await res.json().catch(() => ({}))) as { error?: string; devCode?: string; expiresIn?: number };
    if (res.ok) return { error: null, devCode: data.devCode, expiresIn: data.expiresIn };
    return { error: data.error ?? "Could not send the email. Please try again." };
  } catch {
    return { error: "Network error. Check your connection and try again." };
  }
}

/** Checks the 6-digit code from the verification email. Returns an error message, or null when the email is now verified. */
export async function verifyEmailCode(email: string, code: string): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
    if (res.ok) return null;
    return ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Could not verify the code. Please try again.";
  } catch {
    return "Network error. Check your connection and try again.";
  }
}

export async function signOut() {
  await syncProgress(true); // push anything unsynced first
  try {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  } catch {
    // Even if the request fails, treat this browser as signed out locally.
  }
  clearLocalProgress();
  set({ status: "anon" });
}
