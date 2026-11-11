-- Messages from the /support page: contact requests, feedback and problem reports.
create table support_messages (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('contact', 'feedback', 'report')),
  name       text,
  email      text,
  message    text not null,
  page_url   text,
  user_agent text,
  user_id    uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);
-- split
create index support_messages_created_idx on support_messages (created_at desc);
