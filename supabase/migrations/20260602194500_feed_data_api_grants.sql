-- Explicit Data API grants for feed tables.
-- Newer Supabase projects do not automatically expose new public tables.

grant select on table public.feed_posts to anon, authenticated;
grant select on table public.feed_post_images to anon, authenticated;
grant select on table public.feed_comments to anon, authenticated;
grant select on table public.feed_reactions to anon, authenticated;

grant select on table public.feed_admins to authenticated;
grant insert, update, delete on table public.feed_reactions to authenticated;
grant select, insert on table public.feed_reports to authenticated;

grant all on table public.feed_admins to service_role;
grant all on table public.feed_posts to service_role;
grant all on table public.feed_post_images to service_role;
grant all on table public.feed_comments to service_role;
grant all on table public.feed_reactions to service_role;
grant all on table public.feed_reports to service_role;
