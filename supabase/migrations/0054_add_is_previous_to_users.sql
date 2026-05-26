-- Soft-delete state for employees. Lets the Employees page split the
-- register into Current and Previous sections without losing history.
-- Idempotent: column add is gated, index uses if not exists.

alter table public.users
  add column if not exists is_previous boolean not null default false;

create index if not exists users_is_previous_idx
  on public.users (is_previous);
