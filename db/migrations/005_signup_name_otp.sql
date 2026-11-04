-- Sign-up now collects a display name, and email verification uses a 6-digit code (OTP) instead of a link.
alter table users add column name text;
-- split
-- Wrong guesses for the current code; the code is discarded after too many.
alter table email_verifications add column attempts integer not null default 0;
-- split
-- Pending links from the old flow can't be used any more (they were tokens, not codes).
delete from email_verifications;
