-- Email verification: new accounts must click a link emailed to them before they can sign in.
alter table users add column email_verified_at timestamptz;
-- split
-- Everyone who already has an account keeps working: treat them as verified.
update users set email_verified_at = created_at where email_verified_at is null;
-- split
-- Only a SHA-256 of the emailed token is stored, never the token itself (same approach as sessions).
create table email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
-- split
create index email_verifications_user_id_idx on email_verifications (user_id);
