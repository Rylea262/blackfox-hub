-- Tools get a purchase value and an optional receipt file.
-- Receipt files live in a private 'tool-receipts' bucket; storage
-- policies mirror the tools table RLS (owner + office full access).

alter table public.tools
  add column value numeric(14, 2),
  add column receipt_url text;

insert into storage.buckets (id, name, public, file_size_limit)
values ('tool-receipts', 'tool-receipts', false, 52428800)
on conflict (id) do nothing;

create policy "tool_receipts_owner_office_select"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tool-receipts'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "tool_receipts_owner_office_insert"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tool-receipts'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "tool_receipts_owner_office_update"
  on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tool-receipts'
    and public.current_user_role() in ('owner', 'office')
  )
  with check (
    bucket_id = 'tool-receipts'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "tool_receipts_owner_office_delete"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tool-receipts'
    and public.current_user_role() in ('owner', 'office')
  );
