-- Remove the legacy e-Omang demo feed item and any linked media records.
-- The normal feed should only show live community content; demo moderation data
-- belongs outside the public feed and admin's default mobile experience.
with matched_posts as (
  select id
  from public.feed_posts
  where lower(coalesce(title, '')) like '%e-omang%'
     or lower(coalesce(body, '')) like '%e-omang%'
     or lower(coalesce(link_url, '')) like '%e-omang%'
),
matched_images as (
  select storage_path
  from public.feed_post_images
  where post_id in (select id from matched_posts)
    and storage_path is not null
)
delete from storage.objects
where bucket_id = 'feed-images'
  and name in (select storage_path from matched_images);

delete from public.feed_posts
where id in (
  select id
  from public.feed_posts
  where lower(coalesce(title, '')) like '%e-omang%'
     or lower(coalesce(body, '')) like '%e-omang%'
     or lower(coalesce(link_url, '')) like '%e-omang%'
);
