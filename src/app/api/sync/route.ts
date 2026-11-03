import { getSessionUser } from "@/lib/auth";
import { accountPlayerId } from "@/lib/claim";
import { prisma } from "@/lib/db";
import { parsePayload, type SyncKeyStats, type SyncState } from "@/lib/sync-schema";

type KeyStatRow = { language: "english" | "khmer"; ch: string; n: number; e: number; ms: number; t: number };

/**
 * Weak-keys history. Runs in its own small transaction so a problem here (for example the
 * key_stats migration not applied yet) can never break the rest of the sync.
 * Stores this device's totals and returns the sum of the account's other devices.
 */
async function syncKeyStats(playerId: string, deviceId: string, own: SyncKeyStats): Promise<SyncKeyStats> {
  const rows = (["english", "khmer"] as const).flatMap((language) => Object.entries(own[language]).map(([ch, s]) => ({ language, ch, ...s })));
  return prisma.$transaction(async (tx) => {
    if (rows.length) {
      await tx.$executeRaw`
        insert into key_stats (player_id, device_id, language, ch, attempts, errors, total_ms, timed)
        select ${playerId}::uuid, ${deviceId}::uuid, lg, c, a, e, m, t
        from unnest(${rows.map((r) => r.language)}::text[], ${rows.map((r) => r.ch)}::text[], ${rows.map((r) => r.n)}::int[], ${rows.map((r) => r.e)}::int[], ${rows.map((r) => r.ms)}::int[], ${rows.map((r) => r.t)}::int[]) as x(lg, c, a, e, m, t)
        on conflict (player_id, device_id, language, ch) do update set
          attempts = greatest(key_stats.attempts, excluded.attempts),
          errors = greatest(key_stats.errors, excluded.errors),
          total_ms = greatest(key_stats.total_ms, excluded.total_ms),
          timed = greatest(key_stats.timed, excluded.timed),
          updated_at = now()`;
    }
    const others = await tx.$queryRaw<KeyStatRow[]>`
      select language, ch, least(sum(attempts), 2000000000)::int as n, least(sum(errors), 2000000000)::int as e,
             least(sum(total_ms), 2000000000)::int as ms, least(sum(timed), 2000000000)::int as t
      from key_stats where player_id = ${playerId}::uuid and device_id <> ${deviceId}::uuid
      group by language, ch`;
    const out: SyncKeyStats = { english: {}, khmer: {} };
    for (const r of others) out[r.language][r.ch] = { n: r.n, e: r.e, ms: r.ms, t: r.t };
    return out;
  }, { maxWait: 10_000, timeout: 20_000 });
}


/**
 * POST /api/sync — merges one device's local progress into the database and
 * returns the merged result. Scores, stars, WPM and accuracy keep the higher
 * value, so syncing is idempotent and never lowers a record. Signed-in requests (session cookie)
 * go to the account's player; anonymous ones to the device's player.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 100_000) return Response.json({ error: "Payload too large" }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const payload = parsePayload(json);
  if (!payload) return Response.json({ error: "Invalid payload" }, { status: 400 });

  const user = await getSessionUser();
  try {
    const { state, playerId } = await prisma.$transaction(async (tx) => {
      let id: string;
      if (user) {
        // Signed in: always the account's canonical player, whichever device this is.
        id = await accountPlayerId(tx, user.id);
      } else {
        const existing = await tx.players.findUnique({ where: { device_id: payload.deviceId } });
        if (existing?.user_id) throw new Error("device-linked");
        id = existing ? (await tx.players.update({ where: { id: existing.id }, data: { updated_at: new Date() } })).id : (await tx.players.create({ data: { device_id: payload.deviceId } })).id;
      }

      // One statement per table (unnest) instead of one round-trip per row: the database is remote,
      // so per-row inserts could exceed the transaction timeout.
      const scoreRows = Object.entries(payload.scores);
      if (scoreRows.length) {
        await tx.$executeRaw`
          insert into game_scores (player_id, variant, best_score, best_wpm, best_accuracy, plays)
          select ${id}::uuid, v, s, w, a, p
          from unnest(${scoreRows.map(([v]) => v)}::text[], ${scoreRows.map(([, r]) => r.best)}::int[], ${scoreRows.map(([, r]) => r.bestWpm)}::int[], ${scoreRows.map(([, r]) => r.bestAccuracy)}::int[], ${scoreRows.map(([, r]) => r.plays)}::int[]) as t(v, s, w, a, p)
          on conflict (player_id, variant) do update set
            best_score = greatest(game_scores.best_score, excluded.best_score),
            best_wpm = greatest(game_scores.best_wpm, excluded.best_wpm),
            best_accuracy = greatest(game_scores.best_accuracy, excluded.best_accuracy),
            plays = greatest(game_scores.plays, excluded.plays),
            updated_at = now()`;
      }
      const levelRows = Object.entries(payload.levels);
      if (levelRows.length) {
        await tx.$executeRaw`
          insert into level_progress (player_id, game_id, level, stars, best_score)
          select ${id}::uuid, 'mario-khmer-quest', l, st, sc
          from unnest(${levelRows.map(([l]) => Number(l))}::int[], ${levelRows.map(([, r]) => r.stars)}::int[], ${levelRows.map(([, r]) => r.score)}::int[]) as t(l, st, sc)
          on conflict (player_id, game_id, level) do update set
            stars = greatest(level_progress.stars, excluded.stars),
            best_score = greatest(level_progress.best_score, excluded.best_score),
            updated_at = now()`;
      }
      const practiceRows = Object.entries(payload.practice);
      if (practiceRows.length) {
        await tx.$executeRaw`
          insert into practice_bests (player_id, language, best_wpm, best_accuracy)
          select ${id}::uuid, lg, w, a
          from unnest(${practiceRows.map(([l]) => l)}::text[], ${practiceRows.map(([, r]) => r.bestWpm)}::int[], ${practiceRows.map(([, r]) => r.bestAccuracy)}::int[]) as t(lg, w, a)
          on conflict (player_id, language) do update set
            best_wpm = greatest(practice_bests.best_wpm, excluded.best_wpm),
            best_accuracy = greatest(practice_bests.best_accuracy, excluded.best_accuracy),
            updated_at = now()`;
      }
      if (payload.settings) {
        const settings = payload.settings as object;
        await tx.player_settings.upsert({ where: { player_id: id }, create: { player_id: id, settings }, update: { settings, updated_at: new Date() } });
      }

      const [scores, levels, practice, settings] = await Promise.all([
        tx.game_scores.findMany({ where: { player_id: id } }),
        tx.level_progress.findMany({ where: { player_id: id, game_id: "mario-khmer-quest" } }),
        tx.practice_bests.findMany({ where: { player_id: id } }),
        tx.player_settings.findUnique({ where: { player_id: id } }),
      ]);
      const result: SyncState = {
        scores: Object.fromEntries(scores.map((s) => [s.variant, { best: s.best_score, bestWpm: s.best_wpm, bestAccuracy: s.best_accuracy, plays: s.plays }])),
        levels: Object.fromEntries(levels.map((l) => [String(l.level), { stars: l.stars, score: l.best_score }])),
        practice: Object.fromEntries(practice.map((p) => [p.language, { bestWpm: p.best_wpm, bestAccuracy: p.best_accuracy }])),
        settings: (settings?.settings as Record<string, unknown> | undefined) ?? undefined,
      };
      return { state: result, playerId: id };
    }, { maxWait: 10_000, timeout: 20_000 });
    if (payload.keyStats) {
      try {
        state.keyStats = await syncKeyStats(playerId, payload.deviceId, payload.keyStats);
      } catch (error) {
        console.error("key stats sync failed", error); // non-fatal: scores and levels already synced
      }
    }
    return Response.json(state);
  } catch (error) {
    if (error instanceof Error && error.message === "device-linked") return Response.json({ error: "Device belongs to an account; sign in" }, { status: 409 });
    console.error("sync failed", error);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
