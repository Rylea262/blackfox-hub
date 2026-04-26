-- Adds optional job position (concreter, labourer, operator, admin,
-- contract_admin, or future additions) to users.
-- Separate from `role`, which controls access; position is informational.
-- No CHECK constraint so the dropdown is the single source of truth and
-- new positions can be added without a migration.

alter table public.users
  add column position text;
