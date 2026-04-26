-- Split servicing into a normalized assets table + service records.
-- Each asset (a vehicle or plant item) is tracked once; service events
-- reference the asset.

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('vehicle', 'plant')),
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  unique (name, type)
);

create index assets_type_idx on public.assets (type);

alter table public.assets enable row level security;

create policy assets_owner_office_all on public.assets
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

-- Add asset_id to servicing (nullable for backfill).
alter table public.servicing
  add column asset_id uuid references public.assets(id) on delete cascade;

-- Backfill: create asset rows from distinct (name, type) pairs in
-- existing servicing data. unique(name, type) makes this idempotent.
insert into public.assets (name, type, created_by)
select distinct asset_name, asset_type, created_by
from public.servicing
on conflict (name, type) do nothing;

-- Link each servicing row to its asset.
update public.servicing s
set asset_id = a.id
from public.assets a
where s.asset_name = a.name and s.asset_type = a.type;

-- Now require asset_id and drop the now-redundant text columns.
alter table public.servicing
  alter column asset_id set not null;

alter table public.servicing
  drop column asset_name,
  drop column asset_type;

create index servicing_asset_id_idx on public.servicing (asset_id);
