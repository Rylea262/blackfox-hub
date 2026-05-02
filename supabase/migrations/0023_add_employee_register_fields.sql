-- Adds typical HR-register fields to public.users so the Employees
-- page can act as a data-only register rather than just a permissions
-- admin tool. All optional.

alter table public.users
  add column if not exists phone text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists start_date date,
  add column if not exists notes text;
