create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  password_hash text not null,
  created_at timestamptz not null default now()
);
-- split
-- Only a SHA-256 of the session token is stored, never the token itself.
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
-- split
create index sessions_user_id_idx on sessions (user_id);
-- split
-- Sliding-window attempt counter for sign-in / sign-up, keyed by "email:..." and "ip:...".
create table auth_throttle (
  key text primary key,
  attempts integer not null default 0,
  window_start timestamptz not null default now()
);
-- split
-- A user owns exactly one canonical player row; anonymous device players have user_id null.
alter table players add constraint players_user_id_fkey foreign key (user_id) references users (id) on delete cascade;
-- split
drop index if exists players_user_id_idx;
-- split
create unique index players_user_id_key on players (user_id) where user_id is not null;
