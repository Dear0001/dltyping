import { assertSameOrigin, getSessionUser } from "@/lib/auth";
import { accountPlayerId } from "@/lib/claim";
import { prisma } from "@/lib/db";
import { verifySpaceRun } from "@/lib/arcade/space-verify";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY = 800_000;

type RunRow = { seed: bigint | number; setup: unknown; game: string; wall_ms: number };

/**
 * POST /api/arcade/runs/[id] — submits a run once. Body: { ticks, log }.
 * The server replays the inputs from the seed it issued and stores its own
 * result; the score the browser shows is never trusted.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await assertSameOrigin(request))) return Response.json({ error: "invalid" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "signin" }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "invalid" }, { status: 400 });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return Response.json({ error: "too-large" }, { status: 413 });
  let body: { ticks?: unknown; log?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const playerId = await accountPlayerId(tx, user.id);
      // Claiming the run and marking it finished in one statement: a second submission finds nothing.
      const rows = await tx.$queryRaw<RunRow[]>`
        update arcade_runs set finished_at = now()
        where id = ${id}::uuid and player_id = ${playerId}::uuid and finished_at is null and started_at > now() - interval '3 hours'
        returning seed, setup, game, (extract(epoch from (now() - started_at)) * 1000)::float8 as wall_ms`;
      const run = rows[0];
      if (!run) return Response.json({ error: "not-found" }, { status: 409 });
      if (run.game !== "space-shooter") return Response.json({ error: "invalid" }, { status: 400 });

      const check = verifySpaceRun({ setup: run.setup, seed: Number(run.seed), ticks: body.ticks, log: body.log, wallMs: run.wall_ms });
      if (!check.ok) {
        await tx.$executeRaw`update arcade_runs set status = 'rejected', reject_reason = ${check.reason} where id = ${id}::uuid`;
        return Response.json({ status: "rejected", reason: check.reason }, { status: 422 });
      }
      const out = check.outcome;
      const setup = check.sim.cfg;
      const result = {
        score: out.score.total, wpm: out.wpm, cpm: out.cpm, accuracy: out.accuracy, wave: out.wave, wavesCleared: out.wavesCleared, kills: out.kills, bosses: out.bosses,
        bestCombo: out.bestCombo, durationMs: Math.round(out.timeMs), won: out.won, correctChars: out.correctChars, mistakes: out.mistakes, avgReactionMs: out.avgReactionMs, powersUsed: out.powersUsed,
      };
      await tx.$executeRaw`
        update arcade_runs set status = 'verified', score = ${result.score}, wpm = ${result.wpm}, accuracy = ${result.accuracy}, wave = ${result.wave},
          kills = ${result.kills}, duration_ms = ${result.durationMs}, won = ${result.won}, result = ${JSON.stringify(result)}::jsonb
        where id = ${id}::uuid`;
      // Verified personal best, in the same table the score sync uses (the sync ignores browser-sent Space Shooter scores).
      const variant = `space-shooter:${setup.language}:${setup.difficulty}:${setup.mode}`;
      await tx.$executeRaw`
        insert into game_scores (player_id, variant, best_score, best_wpm, best_accuracy, plays)
        values (${playerId}::uuid, ${variant}, ${result.score}, ${Math.min(result.wpm, 1000)}, ${result.accuracy}, 1)
        on conflict (player_id, variant) do update set
          best_score = greatest(game_scores.best_score, excluded.best_score),
          best_wpm = greatest(game_scores.best_wpm, excluded.best_wpm),
          best_accuracy = greatest(game_scores.best_accuracy, excluded.best_accuracy),
          plays = game_scores.plays + 1,
          updated_at = now()`;
      return Response.json({ status: "verified", result });
    }, { maxWait: 10_000, timeout: 20_000 });
  } catch (error) {
    console.error("arcade run submit failed", error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
