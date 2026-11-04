import { assertSameOrigin, clientIp, throttle } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashToken, isExpired, isPlausibleToken } from "@/lib/verification-core";

/** Confirms an email address from the link in the verification email. Does not sign anyone in. */
export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) return Response.json({ error: "Bad request" }, { status: 400 });
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  if (!isPlausibleToken(body?.token)) return Response.json({ error: "This link is invalid. Request a new verification email." }, { status: 400 });
  if (!(await throttle(`verify:${await clientIp()}`, 30))) return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

  const row = await prisma.email_verifications.findUnique({ where: { token_hash: hashToken(body.token) }, include: { users: true } });
  if (!row || isExpired(row.expires_at)) {
    if (row) await prisma.email_verifications.delete({ where: { id: row.id } });
    return Response.json({ error: "This link has expired or was already used. Request a new verification email." }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.users.update({ where: { id: row.user_id }, data: { email_verified_at: row.users.email_verified_at ?? new Date() } }),
    prisma.email_verifications.deleteMany({ where: { user_id: row.user_id } }),
  ]);
  return Response.json({ ok: true, email: row.users.email });
}
