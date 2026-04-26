-- Plant items track service intervals by operating hours, not just date.
-- Both columns are nullable; the form only writes them when type='plant'.

alter table public.assets
  add column current_hours integer,
  add column next_service_hours integer;
