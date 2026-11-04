import { assertSameOrigin, clientIp, throttle } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { issueVerification } from "@/lib/verification";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Sends a fresh verification code. Always answers the same way, so it can't be used to find out which emails have accounts. */
export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) return Response.json({ error: "Bad request" }, { status: 400 });
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const raw = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!raw || raw.length > 254 || !EMAIL.test(raw)) return Response.json({ error: "Enter a valid email address" }, { status: 400 });

  const ip = await clientIp();
  const allowed = await Promise.all([throttle(`mailip:${ip}`, 10), throttle(`mail:${raw}`, 3)]);
  if (allowed.includes(false)) return Response.json({ error: "Too many emails requested. Try again in a few minutes." }, { status: 429 });

  const user = await prisma.users.findUnique({ where: { email: raw } });
  const result = user && !user.email_verified_at ? await issueVerification(user.id, user.email, user.name) : null;
  return Response.json({ ok: true, ...(result?.devCode && { devCode: result.devCode }) });
}
