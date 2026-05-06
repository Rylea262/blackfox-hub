-- General-purpose company document store. Owner + office can upload
-- and manage; others have no access. Files live in a private bucket.

create table public.company_documents (
  id uuid primary key default gen_random_uuid(),
  file_name text not null check (length(trim(file_name)) > 0),
  file_url text not null,
  description text,
  created_at timestamptz not null default now(),
  uploaded_by uuid references public.users(id)
);

create index company_documents_created_at_idx
  on public.company_documents (created_at desc);

alter table public.company_documents enable row level security;

create policy company_documents_admin_all on public.company_documents
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('company-documents', 'company-documents', false, 52428800)
on conflict (id) do nothing;

create policy "company_documents_owner_office_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'company-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "company_documents_owner_office_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'company-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "company_documents_owner_office_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'company-documents'
    and public.current_user_role() in ('owner', 'office')
  )
  with check (
    bucket_id = 'company-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "company_documents_owner_office_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'company-documents'
    and public.current_user_role() in ('owner', 'office')
  );
