-- Subcontractors register: sole traders and companies with their
-- contact, ABN, insurance dates, and uploaded paperwork.

create table public.subcontractors (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('sole_trader', 'company')),
  name text not null check (length(trim(name)) > 0),
  contact_person text,
  phone text,
  email text,
  address text,
  abn text,
  public_liability_expiry date,
  workcover_expiry date,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index subcontractors_name_idx on public.subcontractors (lower(name));
create index subcontractors_type_idx on public.subcontractors (type);

alter table public.subcontractors enable row level security;

create policy subcontractors_admin_all on public.subcontractors
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

create table public.subcontractor_documents (
  id uuid primary key default gen_random_uuid(),
  subcontractor_id uuid not null references public.subcontractors(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  created_at timestamptz not null default now(),
  uploaded_by uuid references public.users(id)
);

create index subcontractor_documents_sub_idx
  on public.subcontractor_documents (subcontractor_id, created_at desc);

alter table public.subcontractor_documents enable row level security;

create policy subcontractor_documents_admin_all on public.subcontractor_documents
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('subcontractor-documents', 'subcontractor-documents', false, 52428800)
on conflict (id) do nothing;

create policy "subcontractor_documents_owner_office_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'subcontractor-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "subcontractor_documents_owner_office_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'subcontractor-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "subcontractor_documents_owner_office_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'subcontractor-documents'
    and public.current_user_role() in ('owner', 'office')
  )
  with check (
    bucket_id = 'subcontractor-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "subcontractor_documents_owner_office_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'subcontractor-documents'
    and public.current_user_role() in ('owner', 'office')
  );
