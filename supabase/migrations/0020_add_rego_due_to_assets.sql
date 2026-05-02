-- Vehicle registration renewal date. Only meaningful for assets where
-- type = 'vehicle', but stored on the assets table for simplicity (the
-- form only surfaces it for vehicles).

alter table public.assets
  add column if not exists rego_due date;
