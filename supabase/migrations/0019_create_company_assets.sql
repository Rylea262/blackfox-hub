-- Company assets register: real estate, office furniture, IT, etc.
-- Distinct from public.assets (which tracks plant/vehicles for servicing)
-- and public.tools (small portable equipment). No CHECK on category —
-- the dropdown is the source of truth.

create table public.company_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  value numeric(14, 2),
  purchase_date date,
  notes text,
  receipt_url text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index company_assets_category_idx on public.company_assets (category);

alter table public.company_assets enable row level security;

create policy company_assets_owner_office_all on public.company_assets
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('asset-receipts', 'asset-receipts', false, 52428800)
on conflict (id) do nothing;

create policy "asset_receipts_owner_office_select"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'asset-receipts'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "asset_receipts_owner_office_insert"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'asset-receipts'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "asset_receipts_owner_office_update"
  on storage.objects
  for update to authenticated
  using (
    bucket_id = 'asset-receipts'
    and public.current_user_role() in ('owner', 'office')
  )
  with check (
    bucket_id = 'asset-receipts'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "asset_receipts_owner_office_delete"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'asset-receipts'
    and public.current_user_role() in ('owner', 'office')
  );
