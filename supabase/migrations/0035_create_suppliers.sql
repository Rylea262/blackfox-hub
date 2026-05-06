-- Suppliers register: company contact details, trading account info,
-- and zero-or-more uploaded documents (account application, credit
-- terms, etc.). Owner + office full access; same RLS pattern as the
-- other admin-only tables.

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  address text,
  account_number text,
  credit_limit numeric(14, 2),
  payment_terms text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index suppliers_name_idx on public.suppliers (lower(name));

alter table public.suppliers enable row level security;

create policy suppliers_admin_all on public.suppliers
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

create table public.supplier_documents (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  created_at timestamptz not null default now(),
  uploaded_by uuid references public.users(id)
);

create index supplier_documents_supplier_idx
  on public.supplier_documents (supplier_id, created_at desc);

alter table public.supplier_documents enable row level security;

create policy supplier_documents_admin_all on public.supplier_documents
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('supplier-documents', 'supplier-documents', false, 52428800)
on conflict (id) do nothing;

create policy "supplier_documents_owner_office_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'supplier-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "supplier_documents_owner_office_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'supplier-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "supplier_documents_owner_office_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'supplier-documents'
    and public.current_user_role() in ('owner', 'office')
  )
  with check (
    bucket_id = 'supplier-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "supplier_documents_owner_office_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'supplier-documents'
    and public.current_user_role() in ('owner', 'office')
  );
