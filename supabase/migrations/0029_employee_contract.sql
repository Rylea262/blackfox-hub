-- Single employment contract per user (the current signed copy).
-- Storage path lives in users.contract_url; the file lives in the
-- private employee-contracts bucket.

alter table public.users
  add column if not exists contract_url text;

insert into storage.buckets (id, name, public, file_size_limit)
values ('employee-contracts', 'employee-contracts', false, 52428800)
on conflict (id) do nothing;

create policy "employee_contracts_owner_office_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'employee-contracts'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "employee_contracts_owner_office_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'employee-contracts'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "employee_contracts_owner_office_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'employee-contracts'
    and public.current_user_role() in ('owner', 'office')
  )
  with check (
    bucket_id = 'employee-contracts'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "employee_contracts_owner_office_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'employee-contracts'
    and public.current_user_role() in ('owner', 'office')
  );
