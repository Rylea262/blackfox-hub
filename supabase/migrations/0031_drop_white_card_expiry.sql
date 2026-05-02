-- White Card doesn't expire in Australia — drop the column.

alter table public.users
  drop column if exists white_card_expiry;
