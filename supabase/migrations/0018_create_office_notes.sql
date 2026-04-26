-- Office-wide log shared by owner + office. Anyone with access can
-- read every entry. Authors edit/delete their own; owners can
-- edit/delete any entry.

create table public.office_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  subject text,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index office_notes_created_at_idx
  on public.office_notes (created_at desc);

alter table public.office_notes enable row level security;

create policy office_notes_select on public.office_notes
  for select to authenticated
  using (public.current_user_role() in ('owner', 'office'));

create policy office_notes_insert on public.office_notes
  for insert to authenticated
  with check (
    public.current_user_role() in ('owner', 'office')
    and user_id = auth.uid()
  );

create policy office_notes_update on public.office_notes
  for update to authenticated
  using (
    public.current_user_role() = 'owner'
    or (
      public.current_user_role() in ('owner', 'office')
      and user_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'owner'
    or (
      public.current_user_role() in ('owner', 'office')
      and user_id = auth.uid()
    )
  );

create policy office_notes_delete on public.office_notes
  for delete to authenticated
  using (
    public.current_user_role() = 'owner'
    or (
      public.current_user_role() in ('owner', 'office')
      and user_id = auth.uid()
    )
  );
