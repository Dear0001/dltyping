# Arcade games and the multiplayer plan

Phase 1 (three single-player arcade games) is built. This document explains how
the arcade layer is put together, how to add a game, and what Phase 2
(multiplayer) needs. Nothing in Phase 2 exists yet, and no multiplayer control
is shown in the product.

## 1. How the arcade layer is built (Phase 1)

| Layer | Where | What it does |
| --- | --- | --- |
| Typing engine | `src/lib/arcade/typing-core.ts` | Validates one Unicode code point per keystroke, strict and free (Backspace) modes, streaks, WPM/CPM/accuracy. Display is per grapheme cluster through `getCharStates`. |
| Scoring engine | `src/lib/arcade/scoring.ts` | base + accuracy + speed + streak bonuses, times the difficulty multiplier. XP and arcade level. |
| Difficulty | `src/lib/arcade/difficulty.ts` | Easy, Medium, Hard, Expert; multipliers; Khmer pace factor. |
| Content | `src/data/arcade-content.ts`, `src/lib/arcade/content.ts` | Word lists by size and language, seeded picking, running text for races. |
| Game rules | `src/lib/arcade/racing.ts`, `zombie.ts`, `arena.ts` | Pure simulations: `create`, `step(dt)`, input functions, `outcome`. No React, no DOM, seeded random numbers. |
| Progression | `src/lib/arcade/progress.ts` | XP, per-game stats, history, achievements, unlocks (`dlt.arcade.v1` in localStorage). |
| Saving | `src/lib/arcade/save.ts` | Writes a run to personal bests (`dlt.scores`, already synced to accounts), the dashboard session log, and progression. |
| Audio | `src/lib/arcade/audio.ts` | Synthesised sound effects and music. |
| Session and loop | `src/hooks/use-arcade.ts`, `use-arcade-game.ts` | Start, countdown, pause, resume, end; animation loop; canvas sizing. |
| Screens | `src/components/games/arcade/ArcadeShell.tsx` | Details page, HUD frame, pause menu, fullscreen, results. |

### Adding a game (Phase 3)

1. Write the rules as a pure module in `src/lib/arcade/<game>.ts` using the typing core.
2. Write a canvas renderer and a component that calls `useArcadeGame` and renders `ArcadeShell`.
3. Register it: `ARCADE_GAMES` (progress.ts), `typingGames` (data/games.ts), `ACTIVITY_TYPES` and `ACTIVITY_META`, `gameIcons`, `GameThumb`, the dictionary (`game.<id>.*`, `act.d.<id>`), a route under `src/app/games/<id>/`, and the sitemap.
4. Add achievements and unlocks to the lists in progress.ts and tests to `tests/arcade.test.mts`.

## 2. Phase 2: what multiplayer needs

### Why the current design helps

The simulations are deterministic (seeded) and take only keystrokes and time as
input. A server can run the same module, feed it the keystrokes it receives,
and decide the result itself. The client then only draws.

### The main dependency: a real-time server

The site runs on Next.js with serverless route handlers and Neon Postgres.
Route handlers cannot hold WebSocket connections open, so Phase 2 needs one of:

- **A small Node WebSocket service** (for example on Fly.io or Railway) that imports `src/lib/arcade/*` directly. Recommended: full control, server-authoritative state is simple, the rules code is shared.
- A hosted real-time product (Ably, Pusher, PartyKit, Liveblocks). Faster to start, but authoritative game logic still needs a place to run.

This is a hosting and cost decision for the project owner and blocks the rest of Phase 2.

### Server-authoritative match flow

1. Client asks to join (quick match, or a room code). The server authenticates it with the existing session cookie (`sessions` table).
2. Matchmaker groups players by game, language, difficulty and rating; times out and lets the player cancel.
3. Server creates the match with a seed and sends `match.start` with a start time; clients run the countdown against the server clock (offset measured with ping).
4. Clients send `key` events (`seq`, character, client time). The server applies them to its own simulation and broadcasts progress about 10 times a second.
5. The server decides the finish, writes the match and results in one transaction, and sends `match.end`.

Fairness checks on the server: per-player sequence numbers (drops duplicates and replays), rate limits on keys per second, rejection of impossible speeds (sustained rate above a human ceiling), timestamps that must move forward, and results computed only from the server's simulation. A disconnected player keeps their slot for a grace period (the car coasts, the wizard stands still) and can reconnect with the match id.

### Messages

`queue.join`, `queue.leave`, `room.create`, `room.join`, `room.ready`, `room.start`, `match.found`, `match.start`, `key`, `ability`, `state`, `player.left`, `player.rejoined`, `match.end`, `ping`/`pong`.

### Database (new tables, existing `users`/`players` reused)

| Table | Key columns |
| --- | --- |
| `game_results` | id, player_id, game, language, difficulty, score, wpm, accuracy, duration_ms, detail (jsonb), created_at. Index (game, created_at), (player_id, created_at). |
| `player_game_stats` | player_id + game (pk), plays, wins, best_score, best_wpm, totals (jsonb). |
| `player_achievements` | player_id + achievement_id (pk), earned_at. |
| `player_unlocks` | player_id + unlock_id (pk), earned_at. |
| `matches` | id, game, language, difficulty, mode (quick, private, ranked), seed, started_at, ended_at, status. |
| `match_participants` | match_id + player_id (pk), place, score, wpm, accuracy, rating_before, rating_after, left_early. |
| `rooms` | code (pk, unique), owner_id, game, settings (jsonb), max_players, status, expires_at. |
| `ratings` | player_id + game (pk), rating, tier, matches, wins. |
| `daily_challenges` | date + game (pk), seed, settings (jsonb). Results reuse `game_results` with a challenge date. |

Leaderboards (global, daily, weekly, monthly, per game) are queries over
`game_results` and `ratings` with the indexes above. A friends leaderboard needs
a friends feature first, which does not exist yet.

Today arcade progression (XP, achievements, unlocks) lives on the device; only
best scores sync to an account. Moving progression to these tables is the first
Phase 2 task, because ranked play needs server-side records.

### Ranked mode

Rating per game (Elo or Glicko-2) updated from match placement, not WPM alone.
Tiers Bronze to Grandmaster are rating bands. Only server-validated ranked
matches change rating.

### Suggested order

1. Choose and set up the real-time server.
2. Move results and progression to the database (tables above, extend `/api/sync`).
3. Private rooms for Car Racing (the simplest game to synchronise).
4. Quick match, then ranked and leaderboards.
5. Daily competitions.
6. Zombie Survival (co-op) and Battle Arena (duel) multiplayer rules, which need new game design, not only networking.

### Phase 2 is complete when

Two real players on different networks can finish a race whose result is decided
by the server; a private room works from code creation to results; leaving and
rejoining mid-match works; a tampered client cannot change a result; rankings
and leaderboards come from stored matches.
