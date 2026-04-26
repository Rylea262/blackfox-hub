-- Allow office users to update roles (in addition to owners) so the
-- Employees admin page works for both. Replaces the original
-- owner-only update policy from migration 0001.

drop policy if exists users_owner_update on public.users;

create policy users_admin_update on public.users
  for update to authenticated
  using (public.current_user_role() in ('owner', 'office'))
  with check (public.current_user_role() in ('owner', 'office'));
