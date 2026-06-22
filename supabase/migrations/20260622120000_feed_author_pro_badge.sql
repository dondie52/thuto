-- Denormalized Pro badge flag for feed author display.

alter table public.feed_posts
  add column if not exists author_is_pro boolean not null default false;

create or replace function public.profile_is_pro_active(
  p_premium_status text,
  p_premium_until timestamptz
)
returns boolean
language sql
stable
as $$
  select coalesce(p_premium_status, 'free') = 'active'
    and (p_premium_until is null or p_premium_until > now());
$$;

update public.feed_posts fp
set author_is_pro = public.profile_is_pro_active(p.premium_status, p.premium_until)
from public.profiles p
where p.id = fp.author_id;

create or replace function public.sync_feed_author_pro_status()
returns trigger
language plpgsql
as $$
declare
  v_is_pro boolean;
begin
  v_is_pro := public.profile_is_pro_active(new.premium_status, new.premium_until);
  if tg_op = 'INSERT'
    or old.premium_status is distinct from new.premium_status
    or old.premium_until is distinct from new.premium_until then
    update public.feed_posts
    set author_is_pro = v_is_pro
    where author_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_feed_author_pro on public.profiles;
create trigger profiles_sync_feed_author_pro
  after insert or update of premium_status, premium_until on public.profiles
  for each row
  execute function public.sync_feed_author_pro_status();

drop function if exists public.get_personalized_feed(text, integer, timestamptz, uuid, numeric);

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
  author_is_pro boolean,
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
  v_has_tvet_target boolean := false;
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

    v_has_tvet_target := exists (
      select 1
      from unnest(v_targets) as target_id
      where public.infer_institution_category(target_id) = 'technical-colleges-brigades'
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
               and fp.author_institution_category = 'technical-colleges-brigades'
               and not v_has_tvet_target
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
        or fp.author_institution_category is distinct from 'technical-colleges-brigades'
        or v_has_tvet_target
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
      r.author_is_pro,
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
      vp.author_is_pro,
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
