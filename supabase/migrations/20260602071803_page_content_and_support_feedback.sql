-- Supabase-backed public page content and support feedback.
-- Local React defaults remain the offline fallback; published rows override those defaults at runtime.

create table if not exists public.content_page_sections (
  page_key text not null,
  section_key text not null,
  content jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  sort_order integer not null default 0,
  schema_version integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (page_key, section_key),
  constraint content_page_sections_page_key_len check (char_length(page_key) between 2 and 80),
  constraint content_page_sections_section_key_len check (char_length(section_key) between 2 and 120),
  constraint content_page_sections_content_object check (jsonb_typeof(content) = 'object'),
  constraint content_page_sections_schema_version_positive check (schema_version > 0)
);

create index if not exists content_page_sections_lookup_idx
  on public.content_page_sections (page_key, published, sort_order, updated_at desc);

create table if not exists public.support_feedback (
  id uuid primary key default gen_random_uuid(),
  topic text not null default 'feedback',
  message text not null,
  contact_email text,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_feedback_topic_len check (char_length(topic) between 2 and 80),
  constraint support_feedback_message_len check (char_length(message) between 3 and 5000),
  constraint support_feedback_contact_email_len check (contact_email is null or char_length(contact_email) <= 254),
  constraint support_feedback_status_check check (status in ('new', 'reviewing', 'resolved', 'archived'))
);

create index if not exists support_feedback_status_created_idx
  on public.support_feedback (status, created_at desc);

create or replace function public.set_page_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_page_sections_updated_at on public.content_page_sections;
create trigger content_page_sections_updated_at
  before update on public.content_page_sections
  for each row execute function public.set_page_content_updated_at();

drop trigger if exists support_feedback_updated_at on public.support_feedback;
create trigger support_feedback_updated_at
  before update on public.support_feedback
  for each row execute function public.set_page_content_updated_at();

alter table public.content_page_sections enable row level security;
alter table public.support_feedback enable row level security;

grant select on table public.content_page_sections to anon, authenticated;
grant insert, update, delete on table public.content_page_sections to authenticated;
grant insert on table public.support_feedback to anon, authenticated;
grant select, update, delete on table public.support_feedback to authenticated;

drop policy if exists content_page_sections_public_read on public.content_page_sections;
drop policy if exists content_page_sections_admin_insert on public.content_page_sections;
drop policy if exists content_page_sections_admin_update on public.content_page_sections;
drop policy if exists content_page_sections_admin_delete on public.content_page_sections;

create policy content_page_sections_public_read on public.content_page_sections
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

create policy content_page_sections_admin_insert on public.content_page_sections
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy content_page_sections_admin_update on public.content_page_sections
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

create policy content_page_sections_admin_delete on public.content_page_sections
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

drop policy if exists support_feedback_public_insert on public.support_feedback;
drop policy if exists support_feedback_admin_read on public.support_feedback;
drop policy if exists support_feedback_admin_update on public.support_feedback;
drop policy if exists support_feedback_admin_delete on public.support_feedback;

create policy support_feedback_public_insert on public.support_feedback
  for insert
  to anon, authenticated
  with check (
    status = 'new'
    and (user_id is null or user_id = (select auth.uid()))
  );

create policy support_feedback_admin_read on public.support_feedback
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy support_feedback_admin_update on public.support_feedback
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

create policy support_feedback_admin_delete on public.support_feedback
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );
