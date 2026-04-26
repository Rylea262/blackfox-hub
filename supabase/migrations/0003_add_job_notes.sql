-- Notes attached to jobs. Append-only audit trail of comments.

create table public.job_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references public.users(id),
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index job_notes_job_id_created_at_idx
  on public.job_notes (job_id, created_at desc);

alter table public.job_notes enable row level security;

-- Owner + office: read all notes
create policy job_notes_owner_office_select on public.job_notes
  for select to authenticated
  using (public.current_user_role() in ('owner', 'office'));

-- Owner + office: insert as themselves only
create policy job_notes_owner_office_insert on public.job_notes
  for insert to authenticated
  with check (
    public.current_user_role() in ('owner', 'office')
    and user_id = auth.uid()
  );
