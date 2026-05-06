-- Concrete pump fleet, grouped on the page by the operating company.
-- Each pump can have any number of uploaded files (registration, log
-- books, manuals, etc.) in a private bucket.

create table public.concrete_pumps (
  id uuid primary key default gen_random_uuid(),
  company text not null check (length(trim(company)) > 0),
  name text not null check (length(trim(name)) > 0),
  model text,
  serial_number text,
  registration text,
  capacity text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index concrete_pumps_company_idx on public.concrete_pumps (lower(company));
create index concrete_pumps_name_idx on public.concrete_pumps (lower(name));

alter table public.concrete_pumps enable row level security;

create policy concrete_pumps_admin_all on public.concrete_pumps
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

create table public.concrete_pump_documents (
  id uuid primary key default gen_random_uuid(),
  pump_id uuid not null references public.concrete_pumps(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  created_at timestamptz not null default now(),
  uploaded_by uuid references public.users(id)
);

create index concrete_pump_documents_pump_idx
  on public.concrete_pump_documents (pump_id, created_at desc);

alter table public.concrete_pump_documents enable row level security;

create policy concrete_pump_documents_admin_all on public.concrete_pump_documents
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('concrete-pump-documents', 'concrete-pump-documents', false, 52428800)
on conflict (id) do nothing;

create policy "concrete_pump_documents_owner_office_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'concrete-pump-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "concrete_pump_documents_owner_office_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'concrete-pump-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "concrete_pump_documents_owner_office_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'concrete-pump-documents'
    and public.current_user_role() in ('owner', 'office')
  )
  with check (
    bucket_id = 'concrete-pump-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "concrete_pump_documents_owner_office_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'concrete-pump-documents'
    and public.current_user_role() in ('owner', 'office')
  );
