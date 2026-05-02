-- Allow owner and office to insert into public.users so the
-- Employees register can add data-only records without needing the
-- service role key on the server.

create policy users_admin_insert on public.users
  for insert to authenticated
  with check (public.current_user_role() in ('owner', 'office'));
