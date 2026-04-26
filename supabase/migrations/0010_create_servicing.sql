-- Plant and vehicle servicing records. One row per service event,
-- with the next scheduled service date so we can flag what's due.

create table public.servicing (
  id uuid primary key default gen_random_uuid(),
  asset_name text not null,
  asset_type text not null check (asset_type in ('vehicle', 'plant')),
  service_date date,
  next_service_date date,
  serviced_by text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index servicing_next_service_date_idx
  on public.servicing (next_service_date);

alter table public.servicing enable row level security;

create policy servicing_owner_office_all on public.servicing
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));
