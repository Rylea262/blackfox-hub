-- Account details for each pump-hire company.

alter table public.pump_companies
  add column if not exists account_number text,
  add column if not exists credit_limit numeric(14, 2),
  add column if not exists payment_terms text;
