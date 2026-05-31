-- Thuto scroll feed: moderated community posts, images, comments, reactions, reports, and admins.
-- Public reads only published content. Mutating post/comment moderation goes through
-- the feed-moderation Edge Function with the service role key.

create extension if not exists pgcrypto;

create table if not exists feed_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_display_name text not null default 'Student',
  category text not null check (
    category in (
      'opportunity',
      'scholarship',
      'internship',
      'deadline',
      'study_tip',
      'event',
      'notice',
      'question',
      'story',
      'campus_life',
      'general'
    )
  ),
  title text not null default '',
  body text not null check (char_length(trim(body)) between 3 and 2400),
  link_url text,
  status text not null default 'pending_ai' check (status in ('pending_ai', 'published', 'pending_review', 'rejected', 'removed')),
  moderation_decision text,
  moderation_reason text,
  moderation_categories text[] not null default '{}',
  moderation_score numeric(4, 3),
  ai_model text,
  report_count integer not null default 0,
  admin_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feed_posts_title_len check (char_length(title) <= 120),
  constraint feed_posts_author_name_len check (char_length(author_display_name) <= 80),
  constraint feed_posts_link_url_len check (link_url is null or char_length(link_url) <= 500)
);

create table if not exists feed_post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references feed_posts(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  unique (post_id, storage_path),
  constraint feed_post_images_path_len check (char_length(storage_path) <= 700),
  constraint feed_post_images_url_len check (char_length(public_url) <= 1000),
  constraint feed_post_images_alt_len check (char_length(alt_text) <= 180)
);

create table if not exists feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references feed_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_display_name text not null default 'Student',
  body text not null check (char_length(trim(body)) between 1 and 1000),
  status text not null default 'pending_ai' check (status in ('pending_ai', 'published', 'pending_review', 'rejected', 'removed')),
  moderation_decision text,
  moderation_reason text,
  moderation_categories text[] not null default '{}',
  moderation_score numeric(4, 3),
  ai_model text,
  report_count integer not null default 0,
  admin_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feed_comments_author_name_len check (char_length(author_display_name) <= 80)
);

create table if not exists feed_reactions (
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'celebrate', 'support', 'insightful', 'curious')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists feed_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam', 'unsafe', 'harassment', 'misleading', 'irrelevant', 'other')),
  details text not null default '',
  created_at timestamptz not null default now(),
  unique (target_type, target_id, reporter_id),
  constraint feed_reports_details_len check (char_length(details) <= 500)
);

create index if not exists feed_posts_public_idx
  on feed_posts (status, published_at desc nulls last, created_at desc);

create index if not exists feed_posts_author_idx
  on feed_posts (author_id, created_at desc);

create index if not exists feed_posts_admin_idx
  on feed_posts (status, updated_at desc);

create index if not exists feed_post_images_post_idx
  on feed_post_images (post_id, sort_order asc);

create index if not exists feed_comments_post_public_idx
  on feed_comments (post_id, status, published_at asc nulls last, created_at asc);

create index if not exists feed_comments_admin_idx
  on feed_comments (status, updated_at desc);

create index if not exists feed_reactions_post_idx
  on feed_reactions (post_id, reaction);

create index if not exists feed_reports_target_idx
  on feed_reports (target_type, target_id, created_at desc);

create or replace function set_feed_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists feed_posts_updated_at on feed_posts;
create trigger feed_posts_updated_at
  before update on feed_posts
  for each row execute function set_feed_updated_at();

drop trigger if exists feed_comments_updated_at on feed_comments;
create trigger feed_comments_updated_at
  before update on feed_comments
  for each row execute function set_feed_updated_at();

create or replace function increment_feed_report_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.target_type = 'post' then
    update feed_posts set report_count = report_count + 1 where id = new.target_id;
  elsif new.target_type = 'comment' then
    update feed_comments set report_count = report_count + 1 where id = new.target_id;
  end if;
  return new;
end;
$$;

drop trigger if exists feed_reports_increment_count on feed_reports;
create trigger feed_reports_increment_count
  after insert on feed_reports
  for each row execute function increment_feed_report_count();

alter table feed_admins enable row level security;
alter table feed_posts enable row level security;
alter table feed_post_images enable row level security;
alter table feed_comments enable row level security;
alter table feed_reactions enable row level security;
alter table feed_reports enable row level security;

drop policy if exists feed_admins_read_own on feed_admins;
create policy feed_admins_read_own on feed_admins
  for select using (auth.uid() = user_id);

drop policy if exists feed_posts_read_visible on feed_posts;
create policy feed_posts_read_visible on feed_posts
  for select using (
    status = 'published'
    or auth.uid() = author_id
    or exists (select 1 from feed_admins where feed_admins.user_id = auth.uid())
  );

drop policy if exists feed_post_images_read_visible on feed_post_images;
create policy feed_post_images_read_visible on feed_post_images
  for select using (
    exists (
      select 1 from feed_posts
      where feed_posts.id = feed_post_images.post_id
        and (
          feed_posts.status = 'published'
          or feed_posts.author_id = auth.uid()
          or exists (select 1 from feed_admins where feed_admins.user_id = auth.uid())
        )
    )
  );

drop policy if exists feed_comments_read_visible on feed_comments;
create policy feed_comments_read_visible on feed_comments
  for select using (
    status = 'published'
    or auth.uid() = author_id
    or exists (select 1 from feed_admins where feed_admins.user_id = auth.uid())
  );

drop policy if exists feed_reactions_read_public on feed_reactions;
create policy feed_reactions_read_public on feed_reactions
  for select using (
    exists (
      select 1 from feed_posts
      where feed_posts.id = feed_reactions.post_id
        and feed_posts.status = 'published'
    )
  );

drop policy if exists feed_reactions_insert_own on feed_reactions;
create policy feed_reactions_insert_own on feed_reactions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from feed_posts
      where feed_posts.id = feed_reactions.post_id
        and feed_posts.status = 'published'
    )
  );

drop policy if exists feed_reactions_update_own on feed_reactions;
create policy feed_reactions_update_own on feed_reactions
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from feed_posts
      where feed_posts.id = feed_reactions.post_id
        and feed_posts.status = 'published'
    )
  );

drop policy if exists feed_reactions_delete_own on feed_reactions;
create policy feed_reactions_delete_own on feed_reactions
  for delete using (auth.uid() = user_id);

drop policy if exists feed_reports_read_own_or_admin on feed_reports;
create policy feed_reports_read_own_or_admin on feed_reports
  for select using (
    auth.uid() = reporter_id
    or exists (select 1 from feed_admins where feed_admins.user_id = auth.uid())
  );

drop policy if exists feed_reports_insert_own on feed_reports;
create policy feed_reports_insert_own on feed_reports
  for insert with check (auth.uid() = reporter_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feed-images',
  'feed-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists feed_images_public_read on storage.objects;
create policy feed_images_public_read on storage.objects
  for select using (bucket_id = 'feed-images');

drop policy if exists feed_images_authenticated_upload_own_folder on storage.objects;
create policy feed_images_authenticated_upload_own_folder on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'feed-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
