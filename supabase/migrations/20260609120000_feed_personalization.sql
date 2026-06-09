-- Personalized feed: institution targeting, follows, affinity signals, and ranking RPC.

alter table public.feed_posts
  add column if not exists author_university_id text,
  add column if not exists author_institution_category text
    check (
      author_institution_category is null
      or author_institution_category in (
        'universities',
        'technical-colleges',
        'specialised-academics',
        'brigades'
      )
    ),
  add column if not exists target_institution_ids text[] not null default '{}',
  add column if not exists is_national boolean not null default false;

create index if not exists feed_posts_author_university_idx
  on public.feed_posts (author_university_id, published_at desc nulls last);

create index if not exists feed_posts_target_institutions_gin_idx
  on public.feed_posts using gin (target_institution_ids);

create table if not exists public.user_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint user_follows_not_self check (follower_id <> following_id)
);

create index if not exists user_follows_following_idx
  on public.user_follows (following_id, created_at desc);

create table if not exists public.user_feed_affinity (
  user_id uuid not null references auth.users (id) on delete cascade,
  signal_type text not null check (signal_type in ('category', 'institution')),
  signal_value text not null,
  score numeric(8, 2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, signal_type, signal_value),
  constraint user_feed_affinity_value_len check (char_length(signal_value) between 1 and 120)
);

create index if not exists user_feed_affinity_user_idx
  on public.user_feed_affinity (user_id, signal_type, score desc);

alter table public.user_follows enable row level security;
alter table public.user_feed_affinity enable row level security;

drop policy if exists user_follows_select on public.user_follows;
create policy user_follows_select on public.user_follows
  for select to authenticated
  using (true);

drop policy if exists user_follows_mutate on public.user_follows;
create policy user_follows_mutate on public.user_follows
  for all to authenticated
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

drop policy if exists user_feed_affinity_own on public.user_feed_affinity;
create policy user_feed_affinity_own on public.user_feed_affinity
  for select to authenticated
  using (auth.uid() = user_id);

-- Institution category inference (mirrors src/lib/universitiesData.js rules).
create or replace function public.infer_institution_category(p_institution_id text)
returns text
language plpgsql
immutable
as $$
declare
  id text := lower(trim(coalesce(p_institution_id, '')));
begin
  if id = '' then
    return null;
  end if;

  if id in (
    'ub', 'biust', 'bac', 'botho', 'ba-isago', 'abm', 'limkokwing', 'bou', 'boitekanelo',
    'new-era', 'gips', 'bocodol', 'kgale', 'isbs', 'idm', 'guc', 'buan', 'logan-business-college',
    'mega-size-college', 'homeland-college', 'gaborone-commercial-college', 'byte-size-college',
    'awil-college'
  ) then
    return 'universities';
  end if;

  if id in ('krda') or id like '%brigade%' then
    return 'brigades';
  end if;

  if id in (
    'gtc', 'fctve', 'oodi', 'realic', 'palapye-technical-college', 'jwaneng-technical-college',
    'chobe-brigade'
  ) or id like '%technical%' then
    return 'technical-colleges';
  end if;

  if position('university' in id) > 0 then
    return 'universities';
  end if;

  return 'specialised-academics';
end;
$$;

create or replace function public.set_feed_post_institution_fields()
returns trigger
language plpgsql
as $$
begin
  if new.author_university_id is not null then
    new.author_institution_category := public.infer_institution_category(new.author_university_id);
  end if;
  return new;
end;
$$;

drop trigger if exists feed_posts_institution_fields on public.feed_posts;
create trigger feed_posts_institution_fields
  before insert or update of author_university_id on public.feed_posts
  for each row
  execute function public.set_feed_post_institution_fields();

update public.feed_posts fp
set author_university_id = p.university_id
from public.profiles p
where fp.author_id = p.id
  and fp.author_university_id is null
  and p.university_id is not null;

update public.feed_posts
set author_institution_category = public.infer_institution_category(author_university_id)
where author_university_id is not null
  and author_institution_category is null;

create or replace function public.bump_user_feed_affinity(
  p_signal_type text,
  p_signal_value text,
  p_delta numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return;
  end if;

  if p_signal_type not in ('category', 'institution') then
    return;
  end if;

  p_signal_value := trim(coalesce(p_signal_value, ''));
  if p_signal_value = '' then
    return;
  end if;

  insert into public.user_feed_affinity (user_id, signal_type, signal_value, score, updated_at)
  values (v_user_id, p_signal_type, p_signal_value, p_delta, now())
  on conflict (user_id, signal_type, signal_value)
  do update set
    score = public.user_feed_affinity.score + excluded.score,
    updated_at = now();
end;
$$;

create or replace function public.feed_reaction_affinity_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category text;
  v_institution text;
begin
  if tg_op = 'INSERT' then
    select fp.category, fp.author_university_id
      into v_category, v_institution
    from public.feed_posts fp
    where fp.id = new.post_id;

    if v_category is not null then
      perform public.bump_user_feed_affinity('category', v_category, 1);
    end if;

    if v_institution is not null then
      perform public.bump_user_feed_affinity('institution', v_institution, 1);
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    select fp.category, fp.author_university_id
      into v_category, v_institution
    from public.feed_posts fp
    where fp.id = old.post_id;

    if v_category is not null then
      perform public.bump_user_feed_affinity('category', v_category, -1);
    end if;

    if v_institution is not null then
      perform public.bump_user_feed_affinity('institution', v_institution, -1);
    end if;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists feed_reactions_affinity on public.feed_reactions;
create trigger feed_reactions_affinity
  after insert or delete on public.feed_reactions
  for each row
  execute function public.feed_reaction_affinity_trigger();

create or replace function public.feed_report_affinity_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category text;
  v_institution text;
begin
  if new.reason <> 'irrelevant' or new.target_type <> 'post' then
    return new;
  end if;

  select fp.category, fp.author_university_id
    into v_category, v_institution
  from public.feed_posts fp
  where fp.id = new.target_id;

  if v_category is not null then
    perform public.bump_user_feed_affinity('category', v_category, -2);
  end if;

  if v_institution is not null then
    perform public.bump_user_feed_affinity('institution', v_institution, -2);
  end if;

  return new;
end;
$$;

drop trigger if exists feed_reports_affinity on public.feed_reports;
create trigger feed_reports_affinity
  after insert on public.feed_reports
  for each row
  execute function public.feed_report_affinity_trigger();

create or replace function public.feed_category_matches_interests(
  p_category text,
  p_interests text[]
)
returns boolean
language sql
immutable
as $$
  select case
    when coalesce(array_length(p_interests, 1), 0) = 0 then false
    when p_category in ('study_tip', 'question', 'general', 'story') then true
    when p_category in ('scholarship', 'opportunity', 'deadline', 'notice') then true
    when p_category = 'internship' and p_interests && array[
      'technology', 'business', 'engineering', 'health', 'creative', 'hospitality'
    ]::text[] then true
    when p_category = 'graduate_programme' and p_interests && array[
      'technology', 'health', 'business', 'engineering', 'education', 'law_policy', 'creative', 'hospitality'
    ]::text[] then true
    when p_category in ('campus_life', 'event') and p_interests && array[
      'education', 'creative', 'hospitality', 'health', 'business'
    ]::text[] then true
    else false
  end;
$$;

create or replace function public.get_personalized_feed(
  p_mode text default 'for_you',
  p_limit integer default 30,
  p_cursor_published_at timestamptz default null,
  p_cursor_id uuid default null,
  p_cursor_score numeric default null
)
returns table (
  id uuid,
  author_id uuid,
  author_display_name text,
  author_username text,
  author_avatar_url text,
  author_university_id text,
  author_university_name text,
  author_university_status text,
  author_distinction text,
  author_institution_category text,
  target_institution_ids text[],
  is_official boolean,
  is_national boolean,
  category text,
  title text,
  body text,
  link_url text,
  status text,
  moderation_decision text,
  moderation_reason text,
  moderation_categories text[],
  moderation_score numeric,
  ai_model text,
  report_count integer,
  admin_note text,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  removed_at timestamptz,
  feed_score numeric,
  relevance_reason text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_mode text := lower(trim(coalesce(p_mode, 'for_you')));
  v_limit integer := greatest(1, least(coalesce(p_limit, 30), 50));
  v_targets text[] := '{}';
  v_primary_institution text;
  v_interests text[] := '{}';
  v_sponsorship text;
  v_following uuid[] := '{}';
  v_has_brigade_target boolean := false;
begin
  if v_mode not in ('for_you', 'latest') then
    v_mode := 'for_you';
  end if;

  if v_user_id is not null then
    select coalesce(p.university_id, ''), coalesce(p.fields_of_interest, '{}'), p.sponsorship_intent
      into v_primary_institution, v_interests, v_sponsorship
    from public.profiles p
    where p.id = v_user_id;

    select coalesce(array_agg(uti.university_id order by uti.sort_order), '{}')
      into v_targets
    from public.user_target_institutions uti
    where uti.user_id = v_user_id;

    if coalesce(array_length(v_targets, 1), 0) = 0 and v_primary_institution <> '' then
      v_targets := array[v_primary_institution];
    end if;

    select coalesce(array_agg(uf.following_id), '{}')
      into v_following
    from public.user_follows uf
    where uf.follower_id = v_user_id;

    v_has_brigade_target := exists (
      select 1
      from unnest(v_targets) as target_id
      where public.infer_institution_category(target_id) = 'brigades'
    );
  end if;

  return query
  with viewer_pending as (
    select fp.*
    from public.feed_posts fp
    where v_user_id is not null
      and fp.author_id = v_user_id
      and fp.status in ('pending_ai', 'pending_review')
  ),
  reaction_stats as (
    select
      fr.post_id,
      count(*)::numeric as reaction_total
    from public.feed_reactions fr
    join public.feed_posts fp on fp.id = fr.post_id
    where fp.status = 'published'
      and fr.created_at >= now() - interval '7 days'
    group by fr.post_id
  ),
  affinity_category as (
    select signal_value, score
    from public.user_feed_affinity
    where user_id = v_user_id
      and signal_type = 'category'
  ),
  affinity_institution as (
    select signal_value, score
    from public.user_feed_affinity
    where user_id = v_user_id
      and signal_type = 'institution'
  ),
  mutual_follows as (
    select uf1.following_id
    from public.user_follows uf1
    join public.user_follows uf2
      on uf2.follower_id = uf1.following_id
     and uf2.following_id = uf1.follower_id
    where uf1.follower_id = v_user_id
  ),
  published_candidates as (
    select
      fp.*,
      coalesce(rs.reaction_total, 0) as reaction_total,
      case
        when v_mode = 'latest' then 0::numeric
        else (
          100 * power(
            0.95::numeric,
            greatest(0, extract(epoch from (now() - coalesce(fp.published_at, fp.created_at))) / 86400)
          )
          + case when fp.is_official then 30 else 0 end
          + case when fp.is_national then 50 else 0 end
          + case when fp.author_university_id is not null and fp.author_university_id = any (v_targets) then 100 else 0 end
          + case when fp.target_institution_ids && v_targets then 80 else 0 end
          + case when fp.author_id = any (v_following) then 150 else 0 end
          + case when fp.author_id in (select mf.following_id from mutual_follows mf) then 40 else 0 end
          + case
              when public.feed_category_matches_interests(fp.category, v_interests) then 50
              else 0
            end
          + case
              when v_sponsorship is not null
               and fp.category in ('scholarship', 'opportunity', 'deadline') then 25
              else 0
            end
          + least(coalesce(rs.reaction_total, 0) * 2, 40)
          + coalesce((select ac.score from affinity_category ac where ac.signal_value = fp.category), 0) * 10
          + coalesce(
              (select ai.score from affinity_institution ai where ai.signal_value = fp.author_university_id),
              0
            ) * 8
          + case
              when v_mode = 'for_you'
               and coalesce(array_length(v_targets, 1), 0) > 0
               and fp.author_institution_category = 'brigades'
               and not v_has_brigade_target
               and not (fp.author_university_id = any (v_targets))
               and not fp.is_national
               and not fp.is_official
               and not (fp.author_id = any (v_following))
              then -250
              else 0
            end
        )
      end as computed_score,
      case
        when fp.is_official then 'official'
        when fp.is_national then 'national_notice'
        when fp.author_id = any (v_following) then 'following'
        when fp.author_id in (select mf.following_id from mutual_follows mf) then 'mutual_follow'
        when fp.author_university_id is not null and fp.author_university_id = any (v_targets) then 'your_institution'
        when fp.target_institution_ids && v_targets then 'your_institution'
        when public.feed_category_matches_interests(fp.category, v_interests) then 'interest_match'
        when coalesce(rs.reaction_total, 0) >= 5 then 'trending'
        when v_mode = 'for_you' then 'discovery'
        else null
      end as computed_reason
    from public.feed_posts fp
    left join reaction_stats rs on rs.post_id = fp.id
    where fp.status = 'published'
      and (
        v_mode = 'latest'
        or v_user_id is null
        or fp.is_official
        or fp.is_national
        or coalesce(array_length(v_targets, 1), 0) = 0
        or fp.author_id = any (v_following)
        or fp.author_university_id is null
        or fp.author_university_id = any (v_targets)
        or fp.target_institution_ids && v_targets
        or fp.author_institution_category is distinct from 'brigades'
        or v_has_brigade_target
        or fp.category in ('study_tip', 'question', 'scholarship', 'opportunity', 'deadline', 'notice', 'general')
      )
      and (
        v_mode = 'for_you'
        or p_cursor_published_at is null
        or p_cursor_id is null
        or (coalesce(fp.published_at, fp.created_at), fp.id) < (p_cursor_published_at, p_cursor_id)
      )
    order by
      coalesce(fp.published_at, fp.created_at) desc nulls last,
      fp.id desc
    limit case when v_mode = 'for_you' then 500 else v_limit end
  ),
  ranked as (
    select
      pc.*,
      pc.computed_score as feed_score,
      pc.computed_reason as relevance_reason
    from published_candidates pc
    where (
      v_mode = 'latest'
      or v_user_id is null
      or pc.computed_score > -100
    )
    and (
      v_mode <> 'for_you'
      or p_cursor_score is null
      or p_cursor_id is null
      or (pc.computed_score, coalesce(pc.published_at, pc.created_at), pc.id)
        < (p_cursor_score, p_cursor_published_at, p_cursor_id)
    )
    order by
      case when v_mode = 'for_you' then pc.computed_score end desc nulls last,
      coalesce(pc.published_at, pc.created_at) desc nulls last,
      pc.id desc
    limit v_limit
  ),
  combined as (
    select
      r.id,
      r.author_id,
      r.author_display_name,
      r.author_username,
      r.author_avatar_url,
      r.author_university_id,
      r.author_university_name,
      r.author_university_status,
      r.author_distinction,
      r.author_institution_category,
      r.target_institution_ids,
      r.is_official,
      r.is_national,
      r.category,
      r.title,
      r.body,
      r.link_url,
      r.status,
      r.moderation_decision,
      r.moderation_reason,
      r.moderation_categories,
      r.moderation_score,
      r.ai_model,
      r.report_count,
      r.admin_note,
      r.published_at,
      r.created_at,
      r.updated_at,
      r.removed_at,
      r.feed_score,
      r.relevance_reason
    from ranked r

    union all

    select
      vp.id,
      vp.author_id,
      vp.author_display_name,
      vp.author_username,
      vp.author_avatar_url,
      vp.author_university_id,
      vp.author_university_name,
      vp.author_university_status,
      vp.author_distinction,
      vp.author_institution_category,
      vp.target_institution_ids,
      vp.is_official,
      vp.is_national,
      vp.category,
      vp.title,
      vp.body,
      vp.link_url,
      vp.status,
      vp.moderation_decision,
      vp.moderation_reason,
      vp.moderation_categories,
      vp.moderation_score,
      vp.ai_model,
      vp.report_count,
      vp.admin_note,
      vp.published_at,
      vp.created_at,
      vp.updated_at,
      vp.removed_at,
      1000::numeric as feed_score,
      'your_post'::text as relevance_reason
    from viewer_pending vp
    where v_user_id is not null
  )
  select * from combined c
  order by
    case when c.status in ('pending_ai', 'pending_review') then 0 else 1 end,
    c.feed_score desc nulls last,
    c.published_at desc nulls last,
    c.created_at desc,
    c.id desc;
end;
$$;

grant select, insert, delete on table public.user_follows to authenticated;
grant select on table public.user_feed_affinity to authenticated;
grant execute on function public.bump_user_feed_affinity(text, text, numeric) to authenticated;
grant execute on function public.get_personalized_feed(text, integer, timestamptz, uuid, numeric) to anon, authenticated;
