-- Superuser-managed content overrides for universities, programmes, images, and documents.
-- Bundled JSON remains the offline fallback; published patches are merged at runtime.

create table if not exists public.content_university_overrides (
  id text primary key,
  patch jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_university_overrides_patch_object check (jsonb_typeof(patch) = 'object'),
  constraint content_university_overrides_id_len check (char_length(id) between 2 and 120)
);

create table if not exists public.content_programme_overrides (
  id text primary key,
  patch jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_programme_overrides_patch_object check (jsonb_typeof(patch) = 'object'),
  constraint content_programme_overrides_id_len check (char_length(id) between 2 and 160)
);

create index if not exists content_university_overrides_published_idx
  on public.content_university_overrides (published, updated_at desc);

create index if not exists content_programme_overrides_published_idx
  on public.content_programme_overrides (published, updated_at desc);

create or replace function public.set_content_override_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_university_overrides_updated_at on public.content_university_overrides;
create trigger content_university_overrides_updated_at
  before update on public.content_university_overrides
  for each row execute function public.set_content_override_updated_at();

drop trigger if exists content_programme_overrides_updated_at on public.content_programme_overrides;
create trigger content_programme_overrides_updated_at
  before update on public.content_programme_overrides
  for each row execute function public.set_content_override_updated_at();

alter table public.content_university_overrides enable row level security;
alter table public.content_programme_overrides enable row level security;

grant select on table public.content_university_overrides to anon, authenticated;
grant select, insert, update, delete on table public.content_university_overrides to authenticated;
grant select on table public.content_programme_overrides to anon, authenticated;
grant select, insert, update, delete on table public.content_programme_overrides to authenticated;

drop policy if exists content_university_overrides_public_read on public.content_university_overrides;
drop policy if exists content_university_overrides_superuser_read on public.content_university_overrides;
drop policy if exists content_university_overrides_superuser_insert on public.content_university_overrides;
drop policy if exists content_university_overrides_superuser_update on public.content_university_overrides;
drop policy if exists content_university_overrides_superuser_delete on public.content_university_overrides;

create policy content_university_overrides_public_read on public.content_university_overrides
  for select
  to anon, authenticated
  using (
    published = true
    or exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy content_university_overrides_superuser_insert on public.content_university_overrides
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy content_university_overrides_superuser_update on public.content_university_overrides
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy content_university_overrides_superuser_delete on public.content_university_overrides
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

drop policy if exists content_programme_overrides_public_read on public.content_programme_overrides;
drop policy if exists content_programme_overrides_superuser_read on public.content_programme_overrides;
drop policy if exists content_programme_overrides_superuser_insert on public.content_programme_overrides;
drop policy if exists content_programme_overrides_superuser_update on public.content_programme_overrides;
drop policy if exists content_programme_overrides_superuser_delete on public.content_programme_overrides;

create policy content_programme_overrides_public_read on public.content_programme_overrides
  for select
  to anon, authenticated
  using (
    published = true
    or exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy content_programme_overrides_superuser_insert on public.content_programme_overrides
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy content_programme_overrides_superuser_update on public.content_programme_overrides
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy content_programme_overrides_superuser_delete on public.content_programme_overrides
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-assets',
  'content-assets',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists content_assets_public_read on storage.objects;
drop policy if exists content_assets_superuser_insert on storage.objects;
drop policy if exists content_assets_superuser_update on storage.objects;
drop policy if exists content_assets_superuser_delete on storage.objects;

create policy content_assets_public_read on storage.objects
  for select
  using (bucket_id = 'content-assets');

create policy content_assets_superuser_insert on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'content-assets'
    and exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy content_assets_superuser_update on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'content-assets'
    and exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'content-assets'
    and exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy content_assets_superuser_delete on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'content-assets'
    and exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );
