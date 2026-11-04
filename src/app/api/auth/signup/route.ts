import { assertSameOrigin, clientIp, hashPassword, parseCredentials, throttle } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { issueVerification } from "@/lib/verification";

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) return Response.json({ error: "Bad request" }, { status: 400 });
  const body = await request.json().catch(() => null);
  const creds = parseCredentials(body);
  if ("error" in creds) return Response.json({ error: creds.error }, { status: 400 });

  const ip = await clientIp();
  // The last two limits stop the signup form being used to spam someone else's inbox.
  const allowed = await Promise.all([throttle(`ip:${ip}`, 30), throttle(`email:${creds.email}`, 10), throttle(`mail:${creds.email}`, 3), throttle(`mailip:${ip}`, 10)]);
  if (allowed.includes(false)) {
    return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  try {
    const existing = await prisma.users.findUnique({ where: { email: creds.email } });
    if (existing?.email_verified_at) return Response.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    const password_hash = await hashPassword(creds.password);
    // An unverified account is not proof anyone owns the address, so signing up again replaces its password
    // (otherwise someone could squat on an email address and lock its real owner out).
    const user = existing
      ? await prisma.users.update({ where: { id: existing.id }, data: { password_hash } })
      : await prisma.users.create({ data: { email: creds.email, password_hash } });
    const emailSent = await issueVerification(user.id, user.email);
    // No session yet: the account only works once the emailed link has been clicked.
    return Response.json({ pendingVerification: true, email: user.email, emailSent }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return Response.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    }
    console.error("signup failed", error);
    return Response.json({ error: "Could not create the account" }, { status: 500 });
  }
}
