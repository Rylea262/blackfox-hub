-- Force-delete an employee plus all references. Nullable FKs to
-- public.users(id) (created_by, uploaded_by, assigned_leading_hand_id)
-- are set to NULL so historical records survive without attribution.
-- NOT NULL FKs (their own office_notes, job_notes, etc.) are deleted.
-- Uses pg_constraint introspection so new FK columns are picked up
-- automatically without needing to edit this function.

create or replace function public.delete_employee_permanently(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller_id uuid;
  caller_role text;
  rec record;
  sql_query text;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Not authenticated';
  end if;
  if caller_id = target_user_id then
    raise exception 'Cannot delete your own record';
  end if;

  select role into caller_role from public.users where id = caller_id;
  if caller_role not in ('owner', 'office') then
    raise exception 'Only owner or office can delete employees';
  end if;

  for rec in
    select
      n.nspname as schema_name,
      t.relname as table_name,
      a.attname as column_name,
      a.attnotnull as is_not_null
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    join pg_class ft on c.confrelid = ft.oid
    join pg_namespace fn on ft.relnamespace = fn.oid
    join pg_attribute a on a.attrelid = t.oid and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and fn.nspname = 'public'
      and ft.relname = 'users'
      and n.nspname = 'public'
      and array_length(c.conkey, 1) = 1
  loop
    if rec.is_not_null then
      sql_query := format(
        'delete from %I.%I where %I = $1',
        rec.schema_name, rec.table_name, rec.column_name
      );
    else
      sql_query := format(
        'update %I.%I set %I = null where %I = $1',
        rec.schema_name, rec.table_name, rec.column_name, rec.column_name
      );
    end if;
    execute sql_query using target_user_id;
  end loop;

  delete from public.users where id = target_user_id;
end;
$$;

grant execute on function public.delete_employee_permanently(uuid) to authenticated;
