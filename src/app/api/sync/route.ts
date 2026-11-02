import { getSessionUser } from "@/lib/auth";
import { accountPlayerId } from "@/lib/claim";
import { prisma } from "@/lib/db";
import { parsePayload, type SyncState } from "@/lib/sync-schema";

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
    const state = await prisma.$transaction(async (tx) => {
      let id: string;
      if (user) {
        // Signed in: always the account's canonical player, whichever device this is.
        id = await accountPlayerId(tx, user.id);
      } else {
        const existing = await tx.players.findUnique({ where: { device_id: payload.deviceId } });
        if (existing?.user_id) throw new Error("device-linked");
        id = existing ? (await tx.players.update({ where: { id: existing.id }, data: { updated_at: new Date() } })).id : (await tx.players.create({ data: { device_id: payload.deviceId } })).id;
      }

      for (const [variant, s] of Object.entries(payload.scores)) {
        await tx.$executeRaw`
          insert into game_scores (player_id, variant, best_score, best_wpm, best_accuracy, plays)
          values (${id}::uuid, ${variant}, ${s.best}, ${s.bestWpm}, ${s.bestAccuracy}, ${s.plays})
          on conflict (player_id, variant) do update set
            best_score = greatest(game_scores.best_score, excluded.best_score),
            best_wpm = greatest(game_scores.best_wpm, excluded.best_wpm),
            best_accuracy = greatest(game_scores.best_accuracy, excluded.best_accuracy),
            plays = greatest(game_scores.plays, excluded.plays),
            updated_at = now()`;
      }
      for (const [level, l] of Object.entries(payload.levels)) {
        await tx.$executeRaw`
          insert into level_progress (player_id, game_id, level, stars, best_score)
          values (${id}::uuid, 'mario-khmer-quest', ${Number(level)}, ${l.stars}, ${l.score})
          on conflict (player_id, game_id, level) do update set
            stars = greatest(level_progress.stars, excluded.stars),
            best_score = greatest(level_progress.best_score, excluded.best_score),
            updated_at = now()`;
      }
      for (const [language, p] of Object.entries(payload.practice)) {
        await tx.$executeRaw`
          insert into practice_bests (player_id, language, best_wpm, best_accuracy)
          values (${id}::uuid, ${language}, ${p.bestWpm}, ${p.bestAccuracy})
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
      return result;
    });
    return Response.json(state);
  } catch (error) {
    if (error instanceof Error && error.message === "device-linked") return Response.json({ error: "Device belongs to an account; sign in" }, { status: 409 });
    console.error("sync failed", error);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
