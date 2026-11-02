-- Players are anonymous (one per browser/device) until accounts exist.
-- user_id is reserved for a future auth table; no FK yet.
create table players (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null unique,
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- split
create index players_user_id_idx on players (user_id) where user_id is not null;
-- split
-- One row per game variant, e.g. "word-sprint:khmer:hard:60" or "mario-khmer-quest:3:easy".
create table game_scores (
  player_id uuid not null references players (id) on delete cascade,
  variant text not null,
  best_score integer not null default 0 check (best_score >= 0),
  best_wpm integer not null default 0 check (best_wpm >= 0),
  best_accuracy integer not null default 0 check (best_accuracy between 0 and 100),
  plays integer not null default 0 check (plays >= 0),
  updated_at timestamptz not null default now(),
  primary key (player_id, variant)
);
-- split
create index game_scores_variant_score_idx on game_scores (variant, best_score desc);
-- split
create table level_progress (
  player_id uuid not null references players (id) on delete cascade,
  game_id text not null default 'mario-khmer-quest',
  level integer not null check (level > 0),
  stars integer not null default 0 check (stars between 0 and 3),
  best_score integer not null default 0 check (best_score >= 0),
  updated_at timestamptz not null default now(),
  primary key (player_id, game_id, level)
);
-- split
create table practice_bests (
  player_id uuid not null references players (id) on delete cascade,
  language text not null check (language in ('english', 'khmer')),
  best_wpm integer not null default 0 check (best_wpm >= 0),
  best_accuracy integer not null default 0 check (best_accuracy between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (player_id, language)
);
-- split
create table player_settings (
  player_id uuid primary key references players (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
