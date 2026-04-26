-- Decouple public.users from auth.users so we can store data-only
-- employee records (no login, no auth.users entry).
--
-- 1. Drop the foreign key from public.users.id to auth.users.id.
-- 2. Add a unique constraint on email so duplicate tracking-only
--    employees aren't possible.
-- 3. Rewrite handle_new_user to upsert by email — if someone later
--    signs up via Supabase Auth with an email that already has a
--    tracking-only public.users row, the trigger updates that row's
--    id to match the new auth.users id rather than inserting a
--    duplicate. Tracking rows can't have created any content yet
--    (no login, no auth.uid()), so updating their id is safe.

alter table public.users
  drop constraint if exists users_id_fkey;

alter table public.users
  add constraint users_email_unique unique (email);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.users where email = new.email) then
    update public.users set id = new.id where email = new.email;
  else
    insert into public.users (id, email, role)
    values (new.id, new.email, 'leading_hand');
  end if;
  return new;
end;
$$;
