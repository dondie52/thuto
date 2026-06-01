-- Admin control policies for the Thuto in-app admin page.
-- Feed admins can manage operational content without exposing service-role keys.

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.opportunity_posts to authenticated;

drop policy if exists profiles_update_admin on public.profiles;

create policy profiles_update_admin on public.profiles
  for update
  to authenticated
  using (
    exists (
      select 1 from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

drop policy if exists opportunity_posts_admin_select on public.opportunity_posts;
drop policy if exists opportunity_posts_admin_insert on public.opportunity_posts;
drop policy if exists opportunity_posts_admin_update on public.opportunity_posts;
drop policy if exists opportunity_posts_admin_delete on public.opportunity_posts;

create policy opportunity_posts_admin_select on public.opportunity_posts
  for select
  to authenticated
  using (
    exists (
      select 1 from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy opportunity_posts_admin_insert on public.opportunity_posts
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy opportunity_posts_admin_update on public.opportunity_posts
  for update
  to authenticated
  using (
    exists (
      select 1 from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy opportunity_posts_admin_delete on public.opportunity_posts
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );
