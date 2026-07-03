-- Backfill profiles for auth users created before handle_new_user ran or after trigger drift.

insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Harden signup: always ensure a profile row exists for the authenticated user.
create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  result public.profiles;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  insert into public.profiles (id, full_name)
  select
    uid,
    coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), '')
  from auth.users u
  where u.id = uid
  on conflict (id) do nothing;

  select * into result from public.profiles where id = uid;
  return result;
end;
$$;

revoke all on function public.ensure_own_profile() from public;
grant execute on function public.ensure_own_profile() to authenticated;

notify pgrst, 'reload schema';
