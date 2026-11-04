import { createHash, randomBytes } from "node:crypto";

/** Pure helpers for email verification (no database or network), so they can be tested directly. */
export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export const generateToken = () => randomBytes(32).toString("base64url");
/** Only this hash is stored; the token itself exists only in the email. */
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const isPlausibleToken = (token: unknown): token is string => typeof token === "string" && /^[A-Za-z0-9_-]{20,100}$/.test(token);
export const isExpired = (expiresAt: Date, now = new Date()) => expiresAt.getTime() <= now.getTime();
export const verificationLink = (baseUrl: string, token: string) => `${baseUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;

const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function verificationEmail(link: string): { subject: string; html: string; text: string } {
  const safe = escapeHtml(link);
  return {
    subject: "Verify your email for DL Typing",
    text: `Welcome to DL Typing!\n\nConfirm your email address to finish creating your account:\n${link}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
  <h1 style="font-size:22px;margin:0 0 12px">Welcome to DL Typing!</h1>
  <p style="font-size:15px;line-height:1.5">Confirm your email address to finish creating your account.</p>
  <p style="margin:24px 0"><a href="${safe}" style="background:#2563eb;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;display:inline-block">Verify my email</a></p>
  <p style="font-size:13px;color:#475569;line-height:1.5">Or paste this link into your browser:<br><span style="word-break:break-all">${safe}</span></p>
  <p style="font-size:13px;color:#475569">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
</div>`,
  };
}
