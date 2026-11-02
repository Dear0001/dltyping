import { assertSameOrigin, destroySession } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) return Response.json({ error: "Bad request" }, { status: 400 });
  await destroySession();
  return Response.json({ ok: true });
}
