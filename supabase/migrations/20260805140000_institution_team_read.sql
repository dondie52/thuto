-- Lets institution staff see their own teammates, for the CMS Settings > Team and access tab.
--
-- institution_users_own_read (20260625150000_revenue_model_and_partners.sql:142-144) only lets
-- a user see their own membership row, so a partner staff member could not list colleagues at
-- the same institution. profiles_select_own (20260522000000_profiles_and_premium.sql:18-22) is
-- the same restriction one level up — a teammate's full_name was not readable either.
--
-- Both additions are scoped to "same institution_id", nothing wider.

drop policy if exists institution_users_team_read on public.institution_users;
create policy institution_users_team_read on public.institution_users
  for select
  to authenticated
  using (public.is_institution_user(institution_id));

drop policy if exists profiles_select_institution_colleagues on public.profiles;
create policy profiles_select_institution_colleagues on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.institution_users mine
      join public.institution_users theirs on theirs.institution_id = mine.institution_id
      where mine.user_id = (select auth.uid())
        and theirs.user_id = profiles.id
    )
  );

notify pgrst, 'reload schema';
