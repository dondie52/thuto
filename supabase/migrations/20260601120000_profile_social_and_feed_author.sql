-- Profile social fields (avatar, university, distinction) and feed author snapshots.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists university_id text,
  add column if not exists university_name text,
  add column if not exists university_status text
    check (university_status is null or university_status in ('studying', 'aspiring')),
  add column if not exists distinction text;

alter table public.profiles
  drop constraint if exists profiles_distinction_len;

alter table public.profiles
  add constraint profiles_distinction_len
    check (distinction is null or char_length(distinction) <= 120);

alter table public.profiles
  drop constraint if exists profiles_university_name_len;

alter table public.profiles
  add constraint profiles_university_name_len
    check (university_name is null or char_length(university_name) <= 120);

alter table public.profiles
  drop constraint if exists profiles_avatar_url_len;

alter table public.profiles
  add constraint profiles_avatar_url_len
    check (avatar_url is null or char_length(avatar_url) <= 1000);

-- Signed-in users can read basic profile fields for feed author display.
drop policy if exists profiles_select_authenticated on public.profiles;

create policy profiles_select_authenticated on public.profiles
  for select using (auth.uid() is not null);

alter table public.feed_posts
  add column if not exists author_avatar_url text,
  add column if not exists author_university_name text,
  add column if not exists author_university_status text,
  add column if not exists author_distinction text;

alter table public.feed_comments
  add column if not exists author_avatar_url text,
  add column if not exists author_university_name text,
  add column if not exists author_university_status text,
  add column if not exists author_distinction text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_avatars_public_read on storage.objects;

create policy profile_avatars_public_read on storage.objects
  for select using (bucket_id = 'profile-avatars');

drop policy if exists profile_avatars_upload_own_folder on storage.objects;

create policy profile_avatars_upload_own_folder on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists profile_avatars_update_own_folder on storage.objects;

create policy profile_avatars_update_own_folder on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists profile_avatars_delete_own_folder on storage.objects;

create policy profile_avatars_delete_own_folder on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
