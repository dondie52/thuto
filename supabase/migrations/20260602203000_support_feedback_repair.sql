-- Repair support feedback table exposure for projects that missed the original migration
-- or where PostgREST did not refresh its schema cache after the table was created.

create extension if not exists pgcrypto;

create or replace function public.set_page_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

drop trigger if exists support_feedback_updated_at on public.support_feedback;
create trigger support_feedback_updated_at
  before update on public.support_feedback
  for each row execute function public.set_page_content_updated_at();

alter table public.support_feedback enable row level security;

grant insert on table public.support_feedback to anon, authenticated;
grant select, update, delete on table public.support_feedback to authenticated;
grant select, insert, update, delete on table public.support_feedback to service_role;

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

-- Prompt PostgREST to observe the current schema state after repair.
select pg_notification_queue_usage();
