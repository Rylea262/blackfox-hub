-- Track when the driver's licence and White Card next need renewal
-- so the Employees register can flag rows green / orange / red.

alter table public.users
  add column if not exists licence_expiry date,
  add column if not exists white_card_expiry date;
