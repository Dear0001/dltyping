import { sealed } from "@/lib/secure-route";
import { assertSameOrigin, destroySession } from "@/lib/auth";

async function handlePOST(request: Request) {
  if (!(await assertSameOrigin(request))) return Response.json({ error: "Bad request" }, { status: 400 });
  await destroySession();
  return Response.json({ ok: true });
}

export const POST = sealed(handlePOST);
