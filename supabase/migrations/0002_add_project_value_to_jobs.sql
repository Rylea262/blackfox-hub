-- Adds optional contract / project value (in dollars) to jobs.
alter table public.jobs
  add column project_value numeric(14, 2);
