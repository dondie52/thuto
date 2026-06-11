-- Fix profile save: expose onboarding tables to the Data API and add username lookup RPC.

grant select, insert, update, delete on table public.user_target_institutions to authenticated;
grant select, insert, update, delete on table public.user_grade_entries to authenticated;

drop policy if exists user_target_institutions_own on public.user_target_institutions;

create policy user_target_institutions_own on public.user_target_institutions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_grade_entries_own on public.user_grade_entries;

create policy user_grade_entries_own on public.user_grade_entries
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Username availability without exposing other users' profile rows.
create or replace function public.is_username_available(p_username text, p_exclude_user_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(p_username))
      and username is not null
      and (p_exclude_user_id is null or id <> p_exclude_user_id)
  );
$$;

revoke all on function public.is_username_available(text, uuid) from public;
grant execute on function public.is_username_available(text, uuid) to authenticated;
