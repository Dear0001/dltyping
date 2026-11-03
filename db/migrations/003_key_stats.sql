-- Per-key typing history for the weak-keys report.
-- One row per (player, device, language, character). Each device writes only its own
-- absolute totals (idempotent), and the server sums the OTHER devices for the reader,
-- so syncing never double-counts.
create table if not exists key_stats (
  player_id uuid not null references players (id) on delete cascade,
  device_id uuid not null,
  language text not null check (language in ('english', 'khmer')),
  ch text not null check (char_length(ch) between 1 and 8),
  attempts integer not null default 0 check (attempts >= 0),
  errors integer not null default 0 check (errors >= 0),
  total_ms integer not null default 0 check (total_ms >= 0),
  timed integer not null default 0 check (timed >= 0),
  updated_at timestamptz not null default now(),
  primary key (player_id, device_id, language, ch)
);
