-- Adds the company that holds the policy (Black Fox Industries,
-- Black Fox Concrete Pumping, or Black Fox Barbers). Nullable so
-- existing rows keep loading; the dropdown is the gate for new
-- entries.

alter table public.insurances
  add column company text;
