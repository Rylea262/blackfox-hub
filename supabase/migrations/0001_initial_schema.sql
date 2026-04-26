-- Phase 1: schema, helper, trigger, RLS
-- Tables: users, jobs, documents, diary_entries, diary_photos, chat_history

-- ============================================================
-- Tables
-- ============================================================

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null check (role in ('owner', 'office', 'leading_hand')),
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  client text,
  start_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'on_hold')),
  assigned_leading_hand_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  file_url text not null,
  file_name text,
  doc_type text,
  tags text[] not null default '{}',
  uploaded_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  user_id uuid references public.users(id),
  entry_date date not null default current_date,
  works_completed text,
  issues text,
  weather text,
  hours_on_site numeric,
  created_at timestamptz not null default now(),
  unique (job_id, user_id, entry_date)
);

create table public.diary_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.diary_entries(id) on delete cascade,
  photo_url text not null,
  photo_type text check (photo_type in ('progress', 'defect', 'claim')),
  caption text,
  created_at timestamptz not null default now()
);

create table public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  query text,
  response text,
  context_used jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Helper: current user role
-- SECURITY DEFINER bypasses RLS on public.users so policies on
-- other tables can reference role without recursion.
-- ============================================================

create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- ============================================================
-- Trigger: mirror auth.users → public.users on signup
-- New users default to 'leading_hand'; an owner can promote later.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'leading_hand');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Enable RLS
-- ============================================================

alter table public.users          enable row level security;
alter table public.jobs           enable row level security;
alter table public.documents      enable row level security;
alter table public.diary_entries  enable row level security;
alter table public.diary_photos   enable row level security;
alter table public.chat_history   enable row level security;

-- ============================================================
-- RLS: users
-- - any authenticated user reads their own row
-- - owners read all rows and can update them (intended use: change role)
-- ============================================================

create policy users_self_select on public.users
  for select to authenticated
  using (auth.uid() = id);

create policy users_owner_select on public.users
  for select to authenticated
  using (public.current_user_role() = 'owner');

create policy users_owner_update on public.users
  for update to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

-- ============================================================
-- RLS: jobs
-- ============================================================

create policy jobs_owner_office_all on public.jobs
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

create policy jobs_leading_hand_select on public.jobs
  for select to authenticated
  using (
    public.current_user_role() = 'leading_hand'
    and assigned_leading_hand_id = auth.uid()
  );

-- ============================================================
-- RLS: documents
-- ============================================================

create policy documents_owner_office_all on public.documents
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

create policy documents_leading_hand_select on public.documents
  for select to authenticated
  using (
    public.current_user_role() = 'leading_hand'
    and exists (
      select 1 from public.jobs j
      where j.id = documents.job_id
        and j.assigned_leading_hand_id = auth.uid()
    )
  );

-- ============================================================
-- RLS: diary_entries
-- - owner + office read all
-- - leading_hand read/write own only
-- ============================================================

create policy diary_entries_owner_office_select on public.diary_entries
  for select to authenticated
  using (public.current_user_role() in ('owner', 'office'));

create policy diary_entries_leading_hand_all on public.diary_entries
  for all to authenticated
  using (
    public.current_user_role() = 'leading_hand'
    and user_id = auth.uid()
  )
  with check (
    public.current_user_role() = 'leading_hand'
    and user_id = auth.uid()
  );

-- ============================================================
-- RLS: diary_photos (mirror diary_entries visibility)
-- ============================================================

create policy diary_photos_owner_office_select on public.diary_photos
  for select to authenticated
  using (public.current_user_role() in ('owner', 'office'));

create policy diary_photos_leading_hand_all on public.diary_photos
  for all to authenticated
  using (
    public.current_user_role() = 'leading_hand'
    and exists (
      select 1 from public.diary_entries de
      where de.id = diary_photos.entry_id
        and de.user_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'leading_hand'
    and exists (
      select 1 from public.diary_entries de
      where de.id = diary_photos.entry_id
        and de.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS: chat_history
-- - owner read/write own
-- - office and leading_hand: no policy → default deny
-- ============================================================

create policy chat_history_owner_own on public.chat_history
  for all to authenticated
  using (
    public.current_user_role() = 'owner'
    and user_id = auth.uid()
  )
  with check (
    public.current_user_role() = 'owner'
    and user_id = auth.uid()
  );
