-- Adds address and pay (hourly rate or salary) to public.users for
-- the employee register. pay_type is constrained so the UI dropdown
-- and any future calculations can rely on a known set of values.

alter table public.users
  add column if not exists address text,
  add column if not exists pay_type text,
  add column if not exists pay_amount numeric(14, 2);

alter table public.users
  drop constraint if exists users_pay_type_check;

alter table public.users
  add constraint users_pay_type_check
  check (pay_type is null or pay_type in ('hourly', 'salary'));
