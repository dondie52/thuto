-- Repair profile save for projects that missed onboarding migrations or have a stale
-- PostgREST schema cache (e.g. "Could not find the 'bio' column of 'profiles'").

alter table public.profiles
  add column if not exists username text,
  add column if not exists bio text,
  add column if not exists syllabus_type text,
  add column if not exists sponsorship_intent text,
  add column if not exists fields_of_interest text[] not null default '{}',
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_skipped_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_syllabus_type_check;

alter table public.profiles
  add constraint profiles_syllabus_type_check
    check (syllabus_type is null or syllabus_type in ('bgcse', 'igcse', 'as_level', 'o_level'));

alter table public.profiles
  drop constraint if exists profiles_sponsorship_intent_check;

alter table public.profiles
  add constraint profiles_sponsorship_intent_check
    check (sponsorship_intent is null or sponsorship_intent in ('dtef', 'private', 'self_funded'));

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9_]{3,30}$');

alter table public.profiles
  drop constraint if exists profiles_bio_len;

alter table public.profiles
  add constraint profiles_bio_len
    check (bio is null or char_length(bio) <= 150);

alter table public.feed_posts
  add column if not exists author_username text;

alter table public.feed_comments
  add column if not exists author_username text;

create table if not exists public.user_target_institutions (
  user_id uuid not null references auth.users (id) on delete cascade,
  university_id text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, university_id)
);

alter table public.user_target_institutions enable row level security;

grant select, insert, update, delete on table public.user_target_institutions to authenticated;

drop policy if exists user_target_institutions_own on public.user_target_institutions;

create policy user_target_institutions_own on public.user_target_institutions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.user_grade_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id text not null,
  grade text not null,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_id)
);

alter table public.user_grade_entries enable row level security;

grant select, insert, update, delete on table public.user_grade_entries to authenticated;

drop policy if exists user_grade_entries_own on public.user_grade_entries;

create policy user_grade_entries_own on public.user_grade_entries
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.set_user_grade_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_grade_entries_updated_at on public.user_grade_entries;

create trigger user_grade_entries_updated_at
  before update on public.user_grade_entries
  for each row execute function public.set_user_grade_entries_updated_at();

create or replace function public.is_username_available(p_username text, p_exclude_user_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(p_username))
      and username is not null
      and (p_exclude_user_id is null or id <> p_exclude_user_id)
  );
$$;

revoke all on function public.is_username_available(text, uuid) from public;
grant execute on function public.is_username_available(text, uuid) to authenticated;

notify pgrst, 'reload schema';
