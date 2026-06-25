-- Revenue model restructure (B2C Pro plans) + University B2B partner infrastructure.

-- ---------------------------------------------------------------------------
-- B2C: extend premium_plan values (grandfather legacy values)
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_premium_plan_check;
alter table public.profiles add constraint profiles_premium_plan_check
  check (
    premium_plan is null
    or premium_plan in (
      'monthly', 'annual', 'season_pass',
      'yearly', 'five_year'
    )
  );

-- Server-enforced assistant daily usage
create table if not exists public.assistant_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (timezone('utc', now()))::date,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.assistant_daily_usage enable row level security;

drop policy if exists assistant_daily_usage_own on public.assistant_daily_usage;
create policy assistant_daily_usage_own on public.assistant_daily_usage
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on table public.assistant_daily_usage to authenticated;

create or replace function public.record_assistant_usage(p_limit integer default 3)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
  v_limit integer := greatest(coalesce(p_limit, 3), 0);
begin
  if v_user_id is null then
    return jsonb_build_object('allowed', false, 'count', 0, 'limit', v_limit);
  end if;

  if v_limit <= 0 or v_limit >= 999999 then
    return jsonb_build_object('allowed', true, 'count', 0, 'limit', v_limit);
  end if;

  insert into public.assistant_daily_usage (user_id, usage_date, count)
  values (v_user_id, (timezone('utc', now()))::date, 0)
  on conflict (user_id, usage_date) do nothing;

  select count into v_count
  from public.assistant_daily_usage
  where user_id = v_user_id and usage_date = (timezone('utc', now()))::date
  for update;

  if v_count >= v_limit then
    return jsonb_build_object('allowed', false, 'count', v_count, 'limit', v_limit);
  end if;

  update public.assistant_daily_usage
  set count = count + 1, updated_at = now()
  where user_id = v_user_id and usage_date = (timezone('utc', now()))::date
  returning count into v_count;

  return jsonb_build_object('allowed', true, 'count', v_count, 'limit', v_limit);
end;
$$;

grant execute on function public.record_assistant_usage(integer) to authenticated;

-- Bookmark count enforcement for free tier
create or replace function public.enforce_bookmark_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_is_pro boolean;
  v_max integer := 2;
  v_premium_status text;
  v_premium_until timestamptz;
begin
  select premium_status, premium_until
  into v_premium_status, v_premium_until
  from public.profiles
  where id = new.user_id;

  v_is_pro := public.profile_is_pro_active(v_premium_status, v_premium_until);
  if v_is_pro then
    return new;
  end if;

  select count(*)::integer into v_count
  from public.user_bookmarks
  where user_id = new.user_id;

  if v_count >= v_max then
    raise exception 'bookmark_limit_reached' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists user_bookmarks_limit on public.user_bookmarks;
create trigger user_bookmarks_limit
  before insert on public.user_bookmarks
  for each row execute function public.enforce_bookmark_limit();

-- ---------------------------------------------------------------------------
-- B2B: institution partners
-- ---------------------------------------------------------------------------

create table if not exists public.institution_partners (
  institution_id text primary key,
  tier text not null default 'verified'
    check (tier in ('verified', 'insights', 'spotlight', 'growth')),
  verified_at timestamptz,
  stripe_subscription_id text,
  apply_link_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.institution_users (
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id text not null references public.institution_partners (institution_id) on delete cascade,
  role text not null default 'editor'
    check (role in ('owner', 'editor', 'viewer')),
  verified_admin_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, institution_id)
);

create index if not exists institution_users_institution_idx
  on public.institution_users (institution_id);

create table if not exists public.institution_claims (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  work_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists institution_claims_status_idx
  on public.institution_claims (status, created_at desc);

create table if not exists public.featured_placements (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null,
  entity_type text not null check (entity_type in ('institution', 'programme')),
  entity_id text not null,
  placement_key text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  tier text not null default 'spotlight',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists featured_placements_active_idx
  on public.featured_placements (placement_key, starts_at, ends_at);

create table if not exists public.institution_leads (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null,
  programme_id text,
  lead_type text not null default 'inquiry'
    check (lead_type in ('inquiry', 'qualified_interest')),
  student_user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  consent_version text not null default 'v1',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists institution_leads_institution_idx
  on public.institution_leads (institution_id, created_at desc);

-- Partner ownership on content overrides
alter table public.content_university_overrides
  add column if not exists institution_id text;

alter table public.content_programme_overrides
  add column if not exists institution_id text;

-- Helper: is current user an institution partner member?
create or replace function public.is_institution_user(p_institution_id text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.institution_users iu
    where iu.user_id = auth.uid()
      and (p_institution_id is null or iu.institution_id = p_institution_id)
  );
$$;

create or replace function public.get_user_institution_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select institution_id
  from public.institution_users
  where user_id = auth.uid();
$$;

grant execute on function public.is_institution_user(text) to authenticated;
grant execute on function public.get_user_institution_ids() to authenticated;

-- Institution analytics rollup (populated by edge/cron; readable by partners)
create table if not exists public.institution_analytics_daily (
  institution_id text not null,
  event_date date not null,
  event_name text not null,
  entity_id text,
  count integer not null default 0 check (count >= 0),
  primary key (institution_id, event_date, event_name, entity_id)
);

alter table public.institution_partners enable row level security;
alter table public.institution_users enable row level security;
alter table public.institution_claims enable row level security;
alter table public.featured_placements enable row level security;
alter table public.institution_leads enable row level security;
alter table public.institution_analytics_daily enable row level security;

grant select on table public.institution_partners to anon, authenticated;
grant select on table public.featured_placements to anon, authenticated;
grant select, insert, update, delete on table public.institution_users to authenticated;
grant select, insert on table public.institution_claims to authenticated;
grant select, insert on table public.institution_leads to authenticated;
grant select on table public.institution_analytics_daily to authenticated;

-- Public read verified partners
drop policy if exists institution_partners_public_read on public.institution_partners;
create policy institution_partners_public_read on public.institution_partners
  for select using (verified_at is not null);

drop policy if exists featured_placements_public_read on public.featured_placements;
create policy featured_placements_public_read on public.featured_placements
  for select using (starts_at <= now() and ends_at > now());

-- Institution users read own membership
drop policy if exists institution_users_own_read on public.institution_users;
create policy institution_users_own_read on public.institution_users
  for select using (auth.uid() = user_id);

drop policy if exists institution_users_superuser_all on public.institution_users;
create policy institution_users_superuser_all on public.institution_users
  for all using (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
  );

-- Claims: users insert own; read own; superuser manages
drop policy if exists institution_claims_insert_own on public.institution_claims;
create policy institution_claims_insert_own on public.institution_claims
  for insert with check (auth.uid() = user_id);

drop policy if exists institution_claims_read_own on public.institution_claims;
create policy institution_claims_read_own on public.institution_claims
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
  );

drop policy if exists institution_claims_superuser_update on public.institution_claims;
create policy institution_claims_superuser_update on public.institution_claims
  for update using (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
  );

-- Leads: students insert; institution users read their institution
drop policy if exists institution_leads_insert on public.institution_leads;
create policy institution_leads_insert on public.institution_leads
  for insert with check (
    auth.uid() is not null
    and (
      student_user_id is null
      or student_user_id = auth.uid()
    )
  );

drop policy if exists institution_leads_institution_read on public.institution_leads;
create policy institution_leads_institution_read on public.institution_leads
  for select using (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or public.is_institution_user(institution_id)
  );

drop policy if exists institution_leads_institution_update on public.institution_leads;
create policy institution_leads_institution_update on public.institution_leads
  for update using (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or public.is_institution_user(institution_id)
  )
  with check (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or public.is_institution_user(institution_id)
  );

-- Analytics daily: institution users read own
drop policy if exists institution_analytics_daily_read on public.institution_analytics_daily;
create policy institution_analytics_daily_read on public.institution_analytics_daily
  for select using (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or public.is_institution_user(institution_id)
  );

-- Allow analytics insert from authenticated (client events)
drop policy if exists analytics_events_insert_authenticated on public.analytics_events;
create policy analytics_events_insert_authenticated on public.analytics_events
  for insert with check (auth.uid() is not null or user_id is null);

grant insert on table public.analytics_events to authenticated, anon;

-- Institution-scoped content override policies
drop policy if exists content_university_overrides_institution_update on public.content_university_overrides;
create policy content_university_overrides_institution_update on public.content_university_overrides
  for update using (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or (
      public.is_institution_user(id)
      and id in (select public.get_user_institution_ids())
    )
  )
  with check (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or (
      public.is_institution_user(id)
      and id in (select public.get_user_institution_ids())
    )
  );

drop policy if exists content_university_overrides_institution_insert on public.content_university_overrides;
create policy content_university_overrides_institution_insert on public.content_university_overrides
  for insert with check (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or (
      public.is_institution_user(id)
      and id in (select public.get_user_institution_ids())
    )
  );

drop policy if exists content_programme_overrides_institution_update on public.content_programme_overrides;
create policy content_programme_overrides_institution_update on public.content_programme_overrides
  for update using (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or (
      institution_id is not null
      and public.is_institution_user(institution_id)
    )
  )
  with check (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or (
      institution_id is not null
      and public.is_institution_user(institution_id)
    )
  );

drop policy if exists content_programme_overrides_institution_insert on public.content_programme_overrides;
create policy content_programme_overrides_institution_insert on public.content_programme_overrides
  for insert with check (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or (
      institution_id is not null
      and public.is_institution_user(institution_id)
    )
  );

-- Roll up analytics events into daily table (callable by service role / cron)
create or replace function public.rollup_institution_analytics(p_date date default (timezone('utc', now()))::date - 1)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.institution_analytics_daily (institution_id, event_date, event_name, entity_id, count)
  select
    metadata->>'institution_id',
    p_date,
    event_name,
    coalesce(metadata->>'programme_id', metadata->>'entity_id', ''),
    count(*)::integer
  from public.analytics_events
  where (created_at at time zone 'utc')::date = p_date
    and metadata->>'institution_id' is not null
  group by 1, 2, 3, 4
  on conflict (institution_id, event_date, event_name, entity_id)
  do update set count = excluded.count;
end;
$$;
