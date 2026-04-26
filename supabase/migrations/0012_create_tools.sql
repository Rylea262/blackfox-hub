-- Tools and equipment register, grouped on the page by category.
-- No CHECK constraint on category — the dropdown is the source of truth,
-- so adding a new category is a one-line code change.

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  serial_number text,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index tools_category_idx on public.tools (category);

alter table public.tools enable row level security;

create policy tools_owner_office_all on public.tools
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));
