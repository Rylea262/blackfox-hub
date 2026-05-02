-- Employment type plus the relevant identifier numbers. ABN holders
-- supply an ABN; full time and casual employees supply a TFN.

alter table public.users
  add column if not exists employment_type text,
  add column if not exists abn_number text,
  add column if not exists tfn_number text;

alter table public.users
  drop constraint if exists users_employment_type_check;

alter table public.users
  add constraint users_employment_type_check
  check (employment_type is null or employment_type in ('full_time', 'casual', 'abn'));
