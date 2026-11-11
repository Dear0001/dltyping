-- Server-verified arcade runs. The server issues the seed when a signed-in player
-- starts a run, then replays the submitted inputs to compute the result itself.
-- A run can be submitted once (finished_at), only by the player who started it.
create table arcade_runs (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid not null references players(id) on delete cascade,
  game         text not null,
  seed         bigint not null check (seed >= 0 and seed < 4294967296),
  setup        jsonb not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'started' check (status in ('started', 'verified', 'rejected')),
  reject_reason text,
  score        integer,
  wpm          integer,
  accuracy     integer,
  wave         integer,
  kills        integer,
  duration_ms  integer,
  won          boolean,
  result       jsonb
);
-- split
create index arcade_runs_player_idx on arcade_runs (player_id, started_at desc);
-- split
create index arcade_runs_leaderboard_idx on arcade_runs (game, score desc) where status = 'verified';
