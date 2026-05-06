-- Qleave (Queensland Long Service Leave portable scheme) number plus
-- shirt / shorts / jacket sizes for company-issued clothing.

alter table public.users add column if not exists qleave_number text;
alter table public.users add column if not exists shirt_size text;
alter table public.users add column if not exists shorts_size text;
alter table public.users add column if not exists jacket_size text;

alter table public.users drop constraint if exists users_shirt_size_check;
alter table public.users add constraint users_shirt_size_check
  check (shirt_size is null or shirt_size in ('S','M','L','XL','2XL','3XL','4XL'));

alter table public.users drop constraint if exists users_shorts_size_check;
alter table public.users add constraint users_shorts_size_check
  check (shorts_size is null or shorts_size in ('S','M','L','XL','2XL','3XL','4XL'));

alter table public.users drop constraint if exists users_jacket_size_check;
alter table public.users add constraint users_jacket_size_check
  check (jacket_size is null or jacket_size in ('S','M','L','XL','2XL','3XL','4XL'));
