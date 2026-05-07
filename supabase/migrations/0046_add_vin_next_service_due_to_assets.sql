-- Vehicle VIN and next service due (date) on the asset itself, used
-- alongside rego_due to drive the heading banner colour on Servicing.

alter table public.assets
  add column if not exists vin text,
  add column if not exists next_service_due date;
