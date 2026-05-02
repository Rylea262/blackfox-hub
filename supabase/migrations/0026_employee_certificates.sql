-- Employee register: licence number, White Card number, and a
-- certificates table that holds zero-or-more files per employee.

alter table public.users
  add column if not exists licence_number text,
  add column if not exists white_card_number text;

create table if not exists public.employee_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  created_at timestamptz not null default now(),
  uploaded_by uuid references public.users(id)
);

create index if not exists employee_certificates_user_idx
  on public.employee_certificates (user_id, created_at desc);

alter table public.employee_certificates enable row level security;

create policy employee_certificates_admin_all on public.employee_certificates
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('employee-certificates', 'employee-certificates', false, 52428800)
on conflict (id) do nothing;

create policy "employee_certs_owner_office_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'employee-certificates'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "employee_certs_owner_office_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'employee-certificates'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "employee_certs_owner_office_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'employee-certificates'
    and public.current_user_role() in ('owner', 'office')
  )
  with check (
    bucket_id = 'employee-certificates'
    and public.current_user_role() in ('owner', 'office')
  );

create policy "employee_certs_owner_office_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'employee-certificates'
    and public.current_user_role() in ('owner', 'office')
  );
