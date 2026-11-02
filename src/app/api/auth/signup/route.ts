import { assertSameOrigin, clearThrottle, clientIp, createSession, hashPassword, parseCredentials, throttle } from "@/lib/auth";
import { claimDevice } from "@/lib/claim";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) return Response.json({ error: "Bad request" }, { status: 400 });
  const body = await request.json().catch(() => null);
  const creds = parseCredentials(body);
  if ("error" in creds) return Response.json({ error: creds.error }, { status: 400 });

  const ip = await clientIp();
  const allowed = await Promise.all([throttle(`ip:${ip}`, 30), throttle(`email:${creds.email}`, 10)]);
  if (allowed.includes(false)) {
    return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  const password_hash = await hashPassword(creds.password);
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.users.create({ data: { email: creds.email, password_hash } });
      await claimDevice(tx, created.id, creds.deviceId);
      return created;
    });
    await Promise.all([createSession(user.id), clearThrottle(`email:${creds.email}`)]);
    return Response.json({ user: { email: user.email } }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      return Response.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    }
    console.error("signup failed", error);
    return Response.json({ error: "Could not create the account" }, { status: 500 });
  }
}
