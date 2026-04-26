-- File uploads for insurance certificates.
--
-- 1. Column on insurances for the storage path.
-- 2. Private bucket `insurance-certificates`, 50MB per file.
-- 3. Storage policies: owner + office full access. Everyone else gets
--    nothing (no policy for them = default deny).

alter table public.insurances
  add column certificate_url text;

insert into storage.buckets (id, name, public, file_size_limit)
values ('insurance-certificates', 'insurance-certificates', false, 52428800)
on conflict (id) do nothing;

create policy "insurance_certs_owner_office_select"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'insurance-certificates'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "insurance_certs_owner_office_insert"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'insurance-certificates'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "insurance_certs_owner_office_update"
  on storage.objects
  for update to authenticated
  using (
    bucket_id = 'insurance-certificates'
    and public.current_user_role() in ('owner', 'office')
  )
  with check (
    bucket_id = 'insurance-certificates'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "insurance_certs_owner_office_delete"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'insurance-certificates'
    and public.current_user_role() in ('owner', 'office')
  );
