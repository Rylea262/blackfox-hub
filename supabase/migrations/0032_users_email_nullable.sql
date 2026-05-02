-- Email is no longer compulsory when adding an employee. Multiple
-- null emails are allowed by the existing unique constraint per
-- standard SQL semantics.

alter table public.users
  alter column email drop not null;
