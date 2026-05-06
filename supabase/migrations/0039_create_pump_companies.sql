-- Company-level contact info for the Concrete Pumps tab. Keyed by
-- the company name string used on concrete_pumps.company so we don't
-- have to refactor the existing rows.

create table public.pump_companies (
  name text primary key check (length(trim(name)) > 0),
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pump_companies enable row level security;

create policy pump_companies_admin_all on public.pump_companies
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));
