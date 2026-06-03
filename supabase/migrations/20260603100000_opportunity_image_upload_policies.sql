-- Allow Thuto superusers to upload flyer images for opportunity posts.
-- Public reads stay open; writes are restricted to feed_admins membership.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'opportunity-images',
  'opportunity-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists opportunity_images_public_read on storage.objects;
drop policy if exists opportunity_images_superuser_insert on storage.objects;
drop policy if exists opportunity_images_superuser_update on storage.objects;
drop policy if exists opportunity_images_superuser_delete on storage.objects;

create policy opportunity_images_public_read on storage.objects
  for select
  using (bucket_id = 'opportunity-images');

create policy opportunity_images_superuser_insert on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'opportunity-images'
    and exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy opportunity_images_superuser_update on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'opportunity-images'
    and exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'opportunity-images'
    and exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy opportunity_images_superuser_delete on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'opportunity-images'
    and exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );
