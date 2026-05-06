alter table public.pump_companies
  add column if not exists address text,
  add column if not exists abn text;
