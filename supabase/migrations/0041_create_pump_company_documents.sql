-- Documents attached at the pump-hire company level (account
-- application, master agreement, etc.) — separate from per-pump
-- documents.

create table public.pump_company_documents (
  id uuid primary key default gen_random_uuid(),
  company_name text not null check (length(trim(company_name)) > 0),
  file_name text not null,
  file_url text not null,
  created_at timestamptz not null default now(),
  uploaded_by uuid references public.users(id)
);

create index pump_company_documents_company_idx
  on public.pump_company_documents (company_name);

alter table public.pump_company_documents enable row level security;

create policy pump_company_documents_admin_all on public.pump_company_documents
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('pump-company-documents', 'pump-company-documents', false, 52428800)
on conflict (id) do nothing;

create policy "pump_company_documents_owner_office_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'pump-company-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "pump_company_documents_owner_office_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pump-company-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "pump_company_documents_owner_office_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'pump-company-documents'
    and public.current_user_role() in ('owner', 'office')
  )
  with check (
    bucket_id = 'pump-company-documents'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "pump_company_documents_owner_office_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'pump-company-documents'
    and public.current_user_role() in ('owner', 'office')
  );
