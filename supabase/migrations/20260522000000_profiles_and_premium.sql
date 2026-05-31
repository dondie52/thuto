-- Thuto profiles, premium billing fields, and optional cloud sync tables.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  stripe_customer_id text unique,
  payment_provider text not null default 'stripe',
  premium_status text not null default 'free'
    check (premium_status in ('free', 'active', 'past_due', 'canceled')),
  premium_plan text check (premium_plan is null or premium_plan in ('monthly', 'annual', 'season_pass')),
  premium_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role / webhooks update premium fields via service role (bypasses RLS).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- Cloud sync (premium): bookmarks and predictor snapshots per user.

create table if not exists public.user_bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  programme_id text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, programme_id)
);

alter table public.user_bookmarks enable row level security;

drop policy if exists user_bookmarks_own on public.user_bookmarks;

create policy user_bookmarks_own on public.user_bookmarks
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.user_predictor_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  best_six_total numeric,
  requirement_grades jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_predictor_snapshots enable row level security;

drop policy if exists user_predictor_snapshots_own on public.user_predictor_snapshots;

create policy user_predictor_snapshots_own on public.user_predictor_snapshots
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Analytics events (no PII in event names from client).

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

drop policy if exists analytics_events_insert_own on public.analytics_events;

create policy analytics_events_insert_own on public.analytics_events
  for insert with check (user_id is null or auth.uid() = user_id);
