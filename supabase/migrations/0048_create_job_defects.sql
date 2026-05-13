-- Defect log entries per job — short description, the date it was
-- noted/raised, and the dollar cost (rectification or write-off).

create table public.job_defects (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  description text not null check (length(trim(description)) > 0),
  defect_date date not null,
  cost numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index job_defects_job_id_date_idx
  on public.job_defects (job_id, defect_date desc);

alter table public.job_defects enable row level security;

create policy job_defects_owner_office_all on public.job_defects
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));
