-- Tools (specifically lasers) can have a next service / calibration
-- due date so we can warn when one is overdue. Nullable — non-laser
-- tools just leave it as NULL.

alter table public.tools
  add column next_service_due date;
