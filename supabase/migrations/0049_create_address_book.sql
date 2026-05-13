-- Address book of external contacts, attached to one of the two
-- client-facing Black Fox companies. Idempotent so it's safe to
-- re-run on an environment where this was partially applied.

create table if not exists public.address_book_contacts (
  id uuid primary key default gen_random_uuid(),
  bf_company text not null check (bf_company in (
    'black_fox_industries',
    'black_fox_concrete_pumping'
  )),
  name text not null check (length(trim(name)) > 0),
  company text,
  position text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index if not exists address_book_contacts_bf_company_idx
  on public.address_book_contacts (bf_company);
create index if not exists address_book_contacts_name_idx
  on public.address_book_contacts (lower(name));

alter table public.address_book_contacts enable row level security;

drop policy if exists address_book_contacts_admin_all
  on public.address_book_contacts;

create policy address_book_contacts_admin_all on public.address_book_contacts
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));
