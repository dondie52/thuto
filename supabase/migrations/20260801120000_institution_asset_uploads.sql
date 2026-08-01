-- Institution partner staff upload their own logo, campus photos, and staff headshots
-- from the standalone CMS. The content-assets bucket previously allowed writes only
-- from feed_admins, so partner uploads failed with a storage RLS error.
--
-- Partner writes are confined to the `institutions/` prefix; superuser policies from
-- 20260602065306_content_editor_overrides.sql stay in place for everything else, and
-- public read is unchanged.

drop policy if exists content_assets_institution_insert on storage.objects;
drop policy if exists content_assets_institution_update on storage.objects;
drop policy if exists content_assets_institution_delete on storage.objects;

create policy content_assets_institution_insert on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'content-assets'
    and name like 'institutions/%'
    and public.is_institution_user()
  );

create policy content_assets_institution_update on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'content-assets'
    and name like 'institutions/%'
    and public.is_institution_user()
  )
  with check (
    bucket_id = 'content-assets'
    and name like 'institutions/%'
    and public.is_institution_user()
  );

create policy content_assets_institution_delete on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'content-assets'
    and name like 'institutions/%'
    and public.is_institution_user()
  );
