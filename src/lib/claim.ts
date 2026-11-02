import "server-only";
import { Prisma } from "@/generated/prisma/client";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Returns the user's canonical player id, creating it if needed. */
export async function accountPlayerId(tx: Prisma.TransactionClient, userId: string) {
  const existing = await tx.players.findFirst({ where: { user_id: userId }, select: { id: true } });
  if (existing) return existing.id;
  // Fresh random device_id: an account's player must never be reachable via a device id a browser may still hold.
  return (await tx.players.create({ data: { user_id: userId, device_id: crypto.randomUUID() }, select: { id: true } })).id;
}

/**
 * On sign-in/sign-up: folds this device's anonymous player into the account
 * (keeping the higher value everywhere), then deletes the anonymous row.
 */
export async function claimDevice(tx: Prisma.TransactionClient, userId: string, deviceId: string | undefined) {
  const target = await accountPlayerId(tx, userId);
  if (!deviceId || !UUID.test(deviceId)) return target;
  const anon = await tx.players.findFirst({ where: { device_id: deviceId.toLowerCase(), user_id: null }, select: { id: true } });
  if (!anon) return target;
  await tx.$executeRaw`
    insert into game_scores (player_id, variant, best_score, best_wpm, best_accuracy, plays)
    select ${target}::uuid, variant, best_score, best_wpm, best_accuracy, plays from game_scores where player_id = ${anon.id}::uuid
    on conflict (player_id, variant) do update set
      best_score = greatest(game_scores.best_score, excluded.best_score), best_wpm = greatest(game_scores.best_wpm, excluded.best_wpm),
      best_accuracy = greatest(game_scores.best_accuracy, excluded.best_accuracy), plays = greatest(game_scores.plays, excluded.plays), updated_at = now()`;
  await tx.$executeRaw`
    insert into level_progress (player_id, game_id, level, stars, best_score)
    select ${target}::uuid, game_id, level, stars, best_score from level_progress where player_id = ${anon.id}::uuid
    on conflict (player_id, game_id, level) do update set
      stars = greatest(level_progress.stars, excluded.stars), best_score = greatest(level_progress.best_score, excluded.best_score), updated_at = now()`;
  await tx.$executeRaw`
    insert into practice_bests (player_id, language, best_wpm, best_accuracy)
    select ${target}::uuid, language, best_wpm, best_accuracy from practice_bests where player_id = ${anon.id}::uuid
    on conflict (player_id, language) do update set
      best_wpm = greatest(practice_bests.best_wpm, excluded.best_wpm), best_accuracy = greatest(practice_bests.best_accuracy, excluded.best_accuracy), updated_at = now()`;
  await tx.$executeRaw`
    insert into player_settings (player_id, settings) select ${target}::uuid, settings from player_settings where player_id = ${anon.id}::uuid
    on conflict (player_id) do nothing`;
  await tx.players.delete({ where: { id: anon.id } });
  return target;
}
