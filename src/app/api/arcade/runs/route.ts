import { randomInt } from "node:crypto";
import { assertSameOrigin, getSessionUser, throttle } from "@/lib/auth";
import { accountPlayerId } from "@/lib/claim";
import { prisma } from "@/lib/db";
import { parseSpaceSetup } from "@/lib/arcade/space-verify";

/** Games whose runs the server can verify, with their setup validators. */
const VERIFIED_GAMES: Record<string, (setup: unknown) => object | null> = { "space-shooter": parseSpaceSetup };

/**
 * POST /api/arcade/runs — starts a verified run for a signed-in player.
 * Body: { game, setup }. Returns { runId, seed }. Guests get 401 and play locally.
 */
export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) return Response.json({ error: "invalid" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "signin" }, { status: 401 });
  let body: unknown;
  try {
    body = JSON.parse((await request.text()).slice(0, 4000));
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  const { game, setup } = (body ?? {}) as { game?: unknown; setup?: unknown };
  const parse = typeof game === "string" ? VERIFIED_GAMES[game] : undefined;
  const clean = parse?.(setup);
  if (!parse || !clean) return Response.json({ error: "invalid" }, { status: 400 });

  try {
    if (!(await throttle(`arcade-run:${user.id}`, 200))) return Response.json({ error: "rate" }, { status: 429 });
    const seed = randomInt(0, 2 ** 32);
    const runId = await prisma.$transaction(async (tx) => {
      const playerId = await accountPlayerId(tx, user.id);
      const rows = await tx.$queryRaw<{ id: string }[]>`
        insert into arcade_runs (player_id, game, seed, setup) values (${playerId}::uuid, ${game}, ${seed}, ${JSON.stringify(clean)}::jsonb) returning id`;
      return rows[0].id;
    });
    return Response.json({ runId, seed });
  } catch (error) {
    // Most likely the arcade_runs migration has not been applied: the game still works, unverified.
    console.error("arcade run start failed", error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
