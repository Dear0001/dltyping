-- Separate Contact / Feedback / Report pages: categories, subjects, star ratings, reproduction details,
-- an optional screenshot/PDF (kept small, max 3 MB, validated by the API) and a short reference shown to the reporter.
alter table support_messages
  add column category        text,
  add column subject         text,
  add column rating          smallint check (rating between 1 and 5),
  add column steps           text,
  add column expected        text,
  add column actual          text,
  add column reference       text,
  add column attachment      bytea,
  add column attachment_name text,
  add column attachment_type text,
  add column attachment_size integer;
-- split
create unique index support_messages_reference_key on support_messages (reference);
