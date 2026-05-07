-- Allow "trailer" as an asset type. Trailers behave like vehicles on
-- the Servicing tab: rego, rego_due, vin, next_service_due.

alter table public.assets
  drop constraint if exists assets_type_check;

alter table public.assets
  add constraint assets_type_check
  check (type in ('vehicle', 'plant', 'trailer'));
