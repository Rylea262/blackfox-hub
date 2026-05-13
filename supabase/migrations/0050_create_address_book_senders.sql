-- Sender email options shown in the Address Book "From" dropdown.
-- Editable by owner/office. Idempotent so it's safe to re-run.

create table if not exists public.address_book_senders (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (length(trim(email)) > 0),
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

create index if not exists address_book_senders_email_idx
  on public.address_book_senders (lower(email));

alter table public.address_book_senders enable row level security;

drop policy if exists address_book_senders_admin_all
  on public.address_book_senders;

create policy address_book_senders_admin_all on public.address_book_senders
  for all to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));

insert into public.address_book_senders (email)
values
  ('info@blackfoxindustries.com.au'),
  ('accounts@blackfoxindustries.com.au'),
  ('info@blackfoxconcretepumping.com.au'),
  ('accounts@blackfoxconcretepumping.com.au')
on conflict (email) do nothing;
