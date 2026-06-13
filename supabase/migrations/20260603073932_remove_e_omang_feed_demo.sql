-- Remove the legacy e-Omang demo feed item from the Thuto feed.
-- (This is demo post content about e-Omang, not the separate Omang Supabase project.)
delete from public.feed_posts
where id in (
  select id
  from public.feed_posts
  where lower(coalesce(title, '')) like '%e-omang%'
     or lower(coalesce(body, '')) like '%e-omang%'
     or lower(coalesce(link_url, '')) like '%e-omang%'
);
