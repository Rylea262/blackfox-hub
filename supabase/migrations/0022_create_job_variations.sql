-- Variation log entries attached to a job. Each entry is a single
-- approved/proposed variation with a type description, the date it
-- applies to, and a dollar value.

create table public.job_variations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  type text not null check (length(trim(type)) > 0),
  variation_date date not null,
  value numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index job_variations_job_id_date_idx
  on public.job_variations (job_id, variation_date desc);

alter table public.job_variations enable row level security;

create policy job_variations_owner_office_all on public.job_variations
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));
