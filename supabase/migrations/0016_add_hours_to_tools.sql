-- Operating hours tracking, used for ride-on trowel machines so we
-- can warn when service is due based on hours run rather than calendar.

alter table public.tools
  add column current_hours integer,
  add column next_service_hours integer;
