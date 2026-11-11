import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "dlt_session";
const SESSION_DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1 };

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => scryptCb(password, salt, 64, SCRYPT, (err, key) => (err ? reject(err) : resolve(key))));
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

// Used to spend equal time when the email is unknown, so timing doesn't reveal which emails exist.
const DUMMY_SALT = randomBytes(16);

export async function verifyPassword(password: string, stored: string | null) {
  if (!stored) {
    await scrypt(password, DUMMY_SALT);
    return false;
  }
  const [scheme, , , , salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.sessions.create({ data: { user_id: userId, token_hash: sha256(token), expires_at: expires } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires });
}

export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.sessions.findUnique({ where: { token_hash: sha256(token) }, include: { users: true } });
  if (!session || session.expires_at < new Date() || !session.users.email_verified_at) return null;
  return { id: session.users.id, email: session.users.email, name: session.users.name };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.sessions.deleteMany({ where: { token_hash: sha256(token) } });
  store.delete(SESSION_COOKIE);
}

/** CSRF defence on top of SameSite=Lax: only JSON bodies from our own origin. */
export async function assertSameOrigin(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return false;
  return isSameOrigin(request);
}

/** True when the request has no Origin (non-browser client) or comes from this site. For form/multipart endpoints. */
export async function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients; browsers always send Origin on cross-site POSTs
  const host = (await headers()).get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Counts an attempt; returns false once `limit` attempts were made in the last 15 minutes. */
export async function throttle(key: string, limit: number) {
  const rows = await prisma.$queryRaw<{ attempts: number }[]>`
    insert into auth_throttle (key, attempts, window_start) values (${key}, 1, now())
    on conflict (key) do update set
      attempts = case when auth_throttle.window_start < now() - interval '15 minutes' then 1 else auth_throttle.attempts + 1 end,
      window_start = case when auth_throttle.window_start < now() - interval '15 minutes' then now() else auth_throttle.window_start end
    returning attempts`;
  return rows[0].attempts <= limit;
}

export const clearThrottle = (key: string) => prisma.auth_throttle.deleteMany({ where: { key } });

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** A display name: 1-50 characters after trimming, no control characters or angle brackets. */
export function parseName(value: unknown): { name: string } | { error: string } {
  const name = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!name) return { error: "Enter your name" };
  if (name.length > 50) return { error: "Name is too long (50 characters at most)" };
  if (/[\u0000-\u001f\u007f<>]/.test(name)) return { error: "Name contains characters that aren't allowed" };
  return { name };
}

export function parseCredentials(body: unknown): { email: string; password: string; deviceId?: string } | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Invalid request" };
  const { email, password, deviceId } = body as Record<string, unknown>;
  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) return { error: "Enter a valid email address" };
  if (typeof password !== "string" || password.length < 8) return { error: "Password must be at least 8 characters" };
  if (password.length > 128) return { error: "Password is too long" };
  return { email: email.trim().toLowerCase(), password, deviceId: typeof deviceId === "string" ? deviceId : undefined };
}
