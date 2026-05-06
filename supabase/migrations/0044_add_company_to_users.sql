-- Allocate each employee to one of the three Black Fox companies.

alter table public.users
  add column if not exists company text;

alter table public.users
  drop constraint if exists users_company_check;

alter table public.users
  add constraint users_company_check
  check (
    company is null
    or company in (
      'black_fox_industries',
      'black_fox_concrete_pumping',
      'black_fox_barbers'
    )
  );
