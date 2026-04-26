-- Brand for power tools (Makita, DeWalt, etc.). Nullable; the form
-- only writes it when the selected category is power_tools.

alter table public.tools
  add column brand text;
