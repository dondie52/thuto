-- Partner dashboard analytics: roll up programme, outbound link, viewer-country, and discipline dimensions.
-- Cron (unchanged): select public.rollup_institution_analytics();

create or replace function public.rollup_institution_analytics(p_date date default (timezone('utc', now()))::date - 1)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Core event × entity (programme_id, or link_kind for outbound clicks without programme)
  insert into public.institution_analytics_daily (institution_id, event_date, event_name, entity_id, count)
  select
    metadata->>'institution_id',
    p_date,
    event_name,
    coalesce(
      nullif(metadata->>'programme_id', ''),
      nullif(metadata->>'link_kind', ''),
      nullif(metadata->>'entity_id', ''),
      ''
    ),
    count(*)::integer
  from public.analytics_events
  where (created_at at time zone 'utc')::date = p_date
    and metadata->>'institution_id' is not null
    and nullif(metadata->>'institution_id', '') is not null
  group by 1, 2, 3, 4
  on conflict (institution_id, event_date, event_name, entity_id)
  do update set count = excluded.count;

  -- Viewer origin countries (Thuto market country on events)
  insert into public.institution_analytics_daily (institution_id, event_date, event_name, entity_id, count)
  select
    metadata->>'institution_id',
    p_date,
    'viewer_origin',
    coalesce(nullif(metadata->>'viewer_country', ''), 'unknown'),
    count(*)::integer
  from public.analytics_events
  where (created_at at time zone 'utc')::date = p_date
    and metadata->>'institution_id' is not null
    and nullif(metadata->>'institution_id', '') is not null
    and event_name in (
      'programme_view',
      'institution_profile_view',
      'outbound_link_click'
    )
  group by 1, 2, 3, 4
  on conflict (institution_id, event_date, event_name, entity_id)
  do update set count = excluded.count;

  -- Outbound clicks by link kind (website / apply / resource / other)
  insert into public.institution_analytics_daily (institution_id, event_date, event_name, entity_id, count)
  select
    metadata->>'institution_id',
    p_date,
    'outbound_link_kind',
    coalesce(nullif(metadata->>'link_kind', ''), 'other'),
    count(*)::integer
  from public.analytics_events
  where (created_at at time zone 'utc')::date = p_date
    and metadata->>'institution_id' is not null
    and nullif(metadata->>'institution_id', '') is not null
    and event_name = 'outbound_link_click'
  group by 1, 2, 3, 4
  on conflict (institution_id, event_date, event_name, entity_id)
  do update set count = excluded.count;

  -- Discipline interest from programme views (field metadata)
  insert into public.institution_analytics_daily (institution_id, event_date, event_name, entity_id, count)
  select
    metadata->>'institution_id',
    p_date,
    'discipline_view',
    coalesce(nullif(metadata->>'field', ''), 'General'),
    count(*)::integer
  from public.analytics_events
  where (created_at at time zone 'utc')::date = p_date
    and metadata->>'institution_id' is not null
    and nullif(metadata->>'institution_id', '') is not null
    and event_name = 'programme_view'
  group by 1, 2, 3, 4
  on conflict (institution_id, event_date, event_name, entity_id)
  do update set count = excluded.count;
end;
$$;

grant execute on function public.rollup_institution_analytics(date) to authenticated;
