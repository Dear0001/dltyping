import { assertSameOrigin, clientIp, throttle } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { codesMatch, hashCode, isExpired, isPlausibleCode, MAX_CODE_ATTEMPTS } from "@/lib/verification-core";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GONE = "This code has expired or is no longer valid. Request a new one.";

/** Confirms an email address from the 6-digit code in the verification email. Does not sign anyone in. */
export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) return Response.json({ error: "Bad request" }, { status: 400 });
  const body = (await request.json().catch(() => null)) as { email?: unknown; code?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  if (!isPlausibleCode(body?.code)) return Response.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  if (!(await Promise.all([throttle(`verify:${await clientIp()}`, 30), throttle(`verify:${email}`, 15)])).every(Boolean)) {
    return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }

  const user = await prisma.users.findUnique({ where: { email } });
  const row = user && (await prisma.email_verifications.findFirst({ where: { user_id: user.id }, orderBy: { created_at: "desc" } }));
  if (!user || !row || isExpired(row.expires_at)) {
    if (row) await prisma.email_verifications.delete({ where: { id: row.id } });
    return Response.json({ error: GONE }, { status: 400 });
  }
  if (!codesMatch(row.token_hash, hashCode(user.id, body.code))) {
    if (row.attempts + 1 >= MAX_CODE_ATTEMPTS) {
      await prisma.email_verifications.delete({ where: { id: row.id } });
      return Response.json({ error: "Too many wrong codes. Request a new one." }, { status: 400 });
    }
    await prisma.email_verifications.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return Response.json({ error: "That code is not right. Check it and try again." }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.users.update({ where: { id: user.id }, data: { email_verified_at: user.email_verified_at ?? new Date() } }),
    prisma.email_verifications.deleteMany({ where: { user_id: user.id } }),
  ]);
  return Response.json({ ok: true, email: user.email });
}
