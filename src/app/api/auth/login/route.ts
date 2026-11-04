import { assertSameOrigin, clearThrottle, clientIp, createSession, parseCredentials, throttle, verifyPassword } from "@/lib/auth";
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
  const user = await prisma.users.findUnique({ where: { email: creds.email } });
  const ok = await verifyPassword(creds.password, user?.password_hash ?? null);
  if (!user || !ok) return Response.json({ error: "Invalid email or password" }, { status: 401 });
  // Said only after the password is right, so this can't be used to discover which emails have accounts.
  if (!user.email_verified_at) return Response.json({ error: "Please verify your email first. Enter the code from your inbox.", code: "unverified" }, { status: 403 });

  try {
    await prisma.$transaction((tx) => claimDevice(tx, user.id, creds.deviceId));
    await Promise.all([createSession(user.id), clearThrottle(`email:${creds.email}`)]);
    return Response.json({ user: { email: user.email, name: user.name } });
  } catch (error) {
    console.error("login failed", error);
    return Response.json({ error: "Could not sign in" }, { status: 500 });
  }
}
