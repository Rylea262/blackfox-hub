-- Categorise address book contacts by trade/role.
-- Idempotent: column add is gated, check constraint dropped/recreated.

alter table public.address_book_contacts
  add column if not exists category text;

alter table public.address_book_contacts
  drop constraint if exists address_book_contacts_category_check;

alter table public.address_book_contacts
  add constraint address_book_contacts_category_check
  check (
    category is null
    or category in ('builder', 'civil', 'developer', 'concreter', 'pumpy')
  );

create index if not exists address_book_contacts_category_idx
  on public.address_book_contacts (category);
