-- Replace the single account_number on pump_companies with a full
-- accounts contact (name + phone + email).

alter table public.pump_companies
  add column if not exists accounts_contact_name text,
  add column if not exists accounts_contact_phone text,
  add column if not exists accounts_contact_email text;

alter table public.pump_companies
  drop column if exists account_number;
