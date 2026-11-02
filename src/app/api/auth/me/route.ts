import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  return Response.json({ user: user ? { email: user.email } : null }, { headers: { "Cache-Control": "no-store" } });
}
