-- Add 'blocklayer' to the allowed address book contact categories.
-- Idempotent: drops and recreates the check constraint.

alter table public.address_book_contacts
  drop constraint if exists address_book_contacts_category_check;

alter table public.address_book_contacts
  add constraint address_book_contacts_category_check
  check (
    category is null
    or category in (
      'builder',
      'civil',
      'developer',
      'concreter',
      'pumpy',
      'blocklayer'
    )
  );
