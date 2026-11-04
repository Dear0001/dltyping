import { createHash, randomInt, timingSafeEqual } from "node:crypto";

/** Pure helpers for email verification by one-time code (no database or network), so they can be tested directly. */
export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;

/** Six digits from a cryptographically secure source, zero-padded ("004217"). */
export const generateCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
/** Only this hash is stored. The user id is mixed in so the same code for two people never matches the same row. */
export const hashCode = (userId: string, code: string) => createHash("sha256").update(`${userId}:${code}`).digest("hex");
export const codesMatch = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const isPlausibleCode = (code: unknown): code is string => typeof code === "string" && /^\d{6}$/.test(code);
export const isExpired = (expiresAt: Date, now = new Date()) => expiresAt.getTime() <= now.getTime();

const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function verificationEmail(code: string, name?: string | null): { subject: string; html: string; text: string } {
  const hello = name ? `Hi ${name}, welcome` : "Welcome";
  const minutes = CODE_TTL_MS / 60_000;
  return {
    subject: `${code} is your DL Typing verification code`,
    text: `${hello} to DL Typing!\n\nYour verification code is: ${code}\n\nEnter it in the sign-up window to finish creating your account. It expires in ${minutes} minutes. If you didn't create an account, you can ignore this email.`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
  <h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(hello)} to DL Typing!</h1>
  <p style="font-size:15px;line-height:1.5">Enter this code in the sign-up window to finish creating your account:</p>
  <p style="margin:24px 0;text-align:center"><span style="background:#eff6ff;color:#2563eb;font-size:32px;font-weight:bold;letter-spacing:8px;padding:14px 22px;border-radius:10px;display:inline-block">${escapeHtml(code)}</span></p>
  <p style="font-size:13px;color:#475569">This code expires in ${minutes} minutes. If you didn't create an account, you can ignore this email.</p>
</div>`,
  };
}
