-- Remove the legacy e-Omang demo feed item.
-- The normal feed should only show live community content; demo moderation data
-- belongs outside the public feed and admin's default mobile experience.
-- Storage objects are not deleted here (Supabase blocks direct storage.objects writes).
delete from public.feed_posts
where id in (
  select id
  from public.feed_posts
  where lower(coalesce(title, '')) like '%e-omang%'
     or lower(coalesce(body, '')) like '%e-omang%'
     or lower(coalesce(link_url, '')) like '%e-omang%'
);
