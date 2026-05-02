-- Vehicle registration number (rego plate). Only meaningful for assets
-- where type = 'vehicle'; the form only surfaces it for vehicles.

alter table public.assets
  add column if not exists rego text;
