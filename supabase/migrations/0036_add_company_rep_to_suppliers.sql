-- Separate "company rep" contact on each supplier (often a sales rep,
-- distinct from the main accounts contact captured by contact_*).

alter table public.suppliers
  add column if not exists company_rep_name text,
  add column if not exists company_rep_phone text,
  add column if not exists company_rep_email text;
