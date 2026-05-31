-- Official post flag and graduate programme category for the scroll feed.

alter table feed_posts
  add column if not exists is_official boolean not null default false;

alter table feed_posts drop constraint if exists feed_posts_category_check;

alter table feed_posts add constraint feed_posts_category_check check (
  category in (
    'graduate_programme',
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
);
