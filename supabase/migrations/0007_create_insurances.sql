-- Insurance policies the business holds (public liability, workers comp,
-- tools, professional indemnity, etc.). Distinct from per-job insurance
-- documents stored in the documents bucket.

create table public.insurances (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider text,
  policy_number text,
  start_date date,
  expiry_date date,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index insurances_expiry_date_idx on public.insurances (expiry_date);

alter table public.insurances enable row level security;

create policy insurances_owner_office_all on public.insurances
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));
