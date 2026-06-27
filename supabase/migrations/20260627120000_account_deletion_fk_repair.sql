-- Allow auth user deletion when they previously moderated feed content.

alter table public.feed_posts
  drop constraint if exists feed_posts_reviewed_by_fkey;

alter table public.feed_posts
  add constraint feed_posts_reviewed_by_fkey
  foreign key (reviewed_by) references auth.users (id) on delete set null;

alter table public.feed_comments
  drop constraint if exists feed_comments_reviewed_by_fkey;

alter table public.feed_comments
  add constraint feed_comments_reviewed_by_fkey
  foreign key (reviewed_by) references auth.users (id) on delete set null;
