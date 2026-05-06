-- Mark a tool as lost or stolen so it can be moved into a separate
-- "Lost and Stolen" section and excluded from the total tool value.

alter table public.tools
  add column if not exists is_lost boolean not null default false;

create index if not exists tools_is_lost_idx on public.tools (is_lost);
