"use client";

// Client account store: who is signed in, plus sign-in / sign-up / sign-out actions.
import { useSyncExternalStore } from "react";
import { clearLocalProgress, getDeviceId, setSyncAccount, syncProgress } from "@/lib/sync";

export type Account = { status: "loading" | "anon" | "user"; email?: string; /** Granted by the server for this email (see src/lib/perks.ts). */ perks?: { allPets?: boolean } };
let account: Account = { status: "loading" };
const listeners = new Set<() => void>();
const LOADING: Account = { status: "loading" };

function set(next: Account) {
  account = next;
  setSyncAccount(next.status === "user");
  listeners.forEach((l) => l());
}

export function useAccount(): Account {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => account, () => LOADING);
}

export async function refreshAccount() {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const data = (await res.json()) as { user: { email: string; perks?: { allPets?: boolean } } | null };
    set(data.user ? { status: "user", email: data.user.email, perks: data.user.perks } : { status: "anon" });
  } catch {
    if (account.status === "loading") set({ status: "anon" });
  }
}

/** Returns an error message, or null on success. */
export async function authenticate(mode: "login" | "signup", email: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, deviceId: getDeviceId() }) });
    const data = (await res.json().catch(() => ({}))) as { error?: string; user?: { email: string } };
    if (!res.ok || !data.user) return data.error ?? "Something went wrong. Please try again.";
    set({ status: "user", email: data.user.email });
    void refreshAccount(); // pick up account perks (login/signup responses carry only the email)
    await syncProgress(true); // merge account progress into this device
    return null;
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
