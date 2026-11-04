import { getSessionUser } from "@/lib/auth";
import { perksFor } from "@/lib/perks";

export async function GET() {
  const user = await getSessionUser();
  return Response.json({ user: user ? { email: user.email, name: user.name, perks: perksFor(user.email) } : null }, { headers: { "Cache-Control": "no-store" } });
}
