-- Extend opportunity_posts for postgraduate scholarship announcements.

alter table opportunity_posts
  drop constraint if exists opportunity_posts_category_check;

alter table opportunity_posts
  add constraint opportunity_posts_category_check
  check (category in ('private_sponsorship', 'internship', 'postgraduate_scholarship'));
