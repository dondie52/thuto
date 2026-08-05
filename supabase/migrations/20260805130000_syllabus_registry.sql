-- Syllabus registry: move the allow-list out of a hardcoded CHECK and into a lookup table.
--
-- The list of valid syllabus ids was duplicated in two places that had to be edited together —
-- the profiles CHECK constraint and the body of update_own_profile (see
-- 20260719140000_profile_syllabus_sponsorship_markets.sql lines 6-21 and 94-101). Adding a
-- grading system meant remembering both. It is now a row in public.syllabus_types.
--
-- Ordering matters here: the nine legacy ids are seeded before the foreign key is added, so no
-- existing profile row can be orphaned by the change.

create table if not exists public.syllabus_types (
  id text primary key,
  label text not null,
  abbreviation text not null default '',
  region text not null default 'southern',
  countries text[] not null default '{}',
  verified boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

comment on column public.syllabus_types.verified is
  'False means the grading scale is Thuto guidance rather than something confirmed against an official source. The predictor labels these results as estimates.';

alter table public.syllabus_types enable row level security;
grant select on table public.syllabus_types to anon, authenticated;

drop policy if exists syllabus_types_public_read on public.syllabus_types;
create policy syllabus_types_public_read on public.syllabus_types
  for select using (true);

insert into public.syllabus_types (id, label, abbreviation, region, countries, verified, sort_order) values
  ('bgcse',        'BGCSE',                             'BGCSE',     'southern',      '{bw}',                                       true,   10),
  ('igcse',        'IGCSE',                             'IGCSE',     'southern',      '{bw,na,zw,zm,za,ke,gh,ng,mu}',               true,   20),
  ('o_level',      'Cambridge O Level',                 'O Level',   'southern',      '{bw,zw,zm,mw,mu}',                           true,   30),
  ('as_level',     'Cambridge AS Level',                'AS',        'southern',      '{bw,zw,zm,za,na}',                           true,   40),
  ('nssc',         'NSSC (Namibia)',                    'NSSC',      'southern',      '{na}',                                       false,  50),
  ('zimsec_o',     'ZIMSEC O Level',                    'ZIMSEC O',  'southern',      '{zw}',                                       false,  60),
  ('zimsec_a',     'ZIMSEC A Level',                    'ZIMSEC A',  'southern',      '{zw}',                                       false,  70),
  ('ecz',          'ECZ School Certificate (Zambia)',   'ECZ',       'southern',      '{zm}',                                       true,   80),
  ('nsc_matric',   'NSC Matric (South Africa)',         'NSC',       'southern',      '{za}',                                       true,   90),
  ('a_level',      'Cambridge / Pearson A Level',       'A Level',   'southern',      '{bw,zw,zm,za,na,mu,ng,gh}',                  true,  100),
  ('lgcse',        'LGCSE (Lesotho)',                   'LGCSE',     'southern',      '{ls}',                                       false, 110),
  ('egcse',        'EGCSE (Eswatini)',                  'EGCSE',     'southern',      '{sz}',                                       false, 120),
  ('msce',         'MSCE (Malawi)',                     'MSCE',      'southern',      '{mw}',                                       true,  130),
  ('lusophone_20', '12a Classe (Lusophone, /20)',       '12a',       'southern',      '{ao,mz,cv,gw,st}',                           true,  140),
  ('kcse',         'KCSE (Kenya)',                      'KCSE',      'eastern',       '{ke}',                                       true,  150),
  ('necta_csee',   'CSEE (Tanzania)',                   'CSEE',      'eastern',       '{tz}',                                       false, 160),
  ('necta_acsee',  'ACSEE (Tanzania)',                  'ACSEE',     'eastern',       '{tz}',                                       true,  170),
  ('uneb_uce',     'UCE (Uganda O Level)',              'UCE',       'eastern',       '{ug}',                                       false, 180),
  ('uneb_uace',    'UACE (Uganda A Level)',             'UACE',      'eastern',       '{ug}',                                       true,  190),
  ('rw_alevel',    'Rwanda A-Level (Senior 6)',         'A2',        'eastern',       '{rw}',                                       true,  200),
  ('euee',         'EUEE (Ethiopia)',                   'EUEE',      'eastern',       '{et}',                                       false, 210),
  ('wassce_gh',    'WASSCE (Ghana)',                    'WASSCE',    'western',       '{gh}',                                       true,  220),
  ('wassce_ng',    'WASSCE / SSCE (Nigeria)',           'WAEC',      'western',       '{ng}',                                       true,  230),
  ('gce_cm',       'Cameroon GCE',                      'GCE',       'central',       '{cm}',                                       false, 240),
  ('bac_20',       'Baccalaureat (francophone, /20)',   'BAC',       'northern',      '{ma,sn,ci,tn,dz,ml,bf,bj,tg,ne,cm,ga,cd}',   true,  250),
  ('thanaweya',    'Thanaweya Amma (Egypt)',            'Thanaweya', 'northern',      '{eg}',                                       false, 260),
  ('ib_dp',        'IB Diploma Programme',              'IB',        'international', '{}',                                         true,  270)
on conflict (id) do update set
  label = excluded.label,
  abbreviation = excluded.abbreviation,
  region = excluded.region,
  countries = excluded.countries,
  verified = excluded.verified,
  sort_order = excluded.sort_order;

-- Replace the enumerated CHECK with a referential constraint.
alter table public.profiles drop constraint if exists profiles_syllabus_type_check;

-- Defensive: the seed above is a strict superset of the previous allow-list, so this should
-- touch zero rows. It exists so the foreign key cannot fail on unexpected data.
update public.profiles p
   set syllabus_type = null
 where p.syllabus_type is not null
   and not exists (select 1 from public.syllabus_types s where s.id = p.syllabus_type);

alter table public.profiles drop constraint if exists profiles_syllabus_type_fkey;
alter table public.profiles
  add constraint profiles_syllabus_type_fkey
  foreign key (syllabus_type) references public.syllabus_types (id) on update cascade;

create or replace function public.is_valid_syllabus_type(p_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.syllabus_types where id = p_id and active);
$$;

revoke all on function public.is_valid_syllabus_type(text) from public;
grant execute on function public.is_valid_syllabus_type(text) to anon, authenticated;

-- A predictor snapshot is meaningless without the scale it was produced on: an APS of 34 is not
-- 34 BGCSE points.
alter table public.user_predictor_snapshots
  add column if not exists syllabus_type text references public.syllabus_types (id) on update cascade;

comment on column public.user_predictor_snapshots.syllabus_type is
  'Null means the snapshot predates multi-syllabus support and should be read as BGCSE.';

-- Reproduced verbatim from 20260719140000_profile_syllabus_sponsorship_markets.sql, with only
-- the syllabus_type branch changed. `create or replace function` swaps the whole body, so a
-- dropped branch would silently stop that field from ever saving.
create or replace function public.update_own_profile(patch jsonb)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  result public.profiles;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  insert into public.profiles (id)
  values (uid)
  on conflict (id) do nothing;

  update public.profiles
  set
    full_name = case
      when patch ? 'full_name' then left(nullif(trim(patch->>'full_name'), ''), 80)
      else full_name
    end,
    username = case
      when patch ? 'username' then nullif(lower(trim(patch->>'username')), '')
      else username
    end,
    bio = case
      when patch ? 'bio' then nullif(left(trim(patch->>'bio'), 150), '')
      else bio
    end,
    university_id = case
      when patch ? 'university_id' then nullif(left(trim(patch->>'university_id'), 80), '')
      else university_id
    end,
    university_name = case
      when patch ? 'university_name' then nullif(left(trim(patch->>'university_name'), 120), '')
      else university_name
    end,
    university_status = case
      when patch ? 'university_status' and patch->>'university_status' in ('studying', 'aspiring')
        then patch->>'university_status'
      when patch ? 'university_status' then null
      else university_status
    end,
    distinction = case
      when patch ? 'distinction' then nullif(left(trim(patch->>'distinction'), 120), '')
      else distinction
    end,
    avatar_url = case
      when patch ? 'avatar_url' then nullif(left(trim(patch->>'avatar_url'), 1000), '')
      else avatar_url
    end,
    syllabus_type = case
      when patch ? 'syllabus_type' and public.is_valid_syllabus_type(patch->>'syllabus_type')
        then patch->>'syllabus_type'
      when patch ? 'syllabus_type' then null
      else syllabus_type
    end,
    sponsorship_intent = case
      when patch ? 'sponsorship_intent' and patch->>'sponsorship_intent' in (
        'dtef', 'nsfaf', 'gov_zw', 'helsb', 'nsfas', 'private', 'self_funded'
      )
        then patch->>'sponsorship_intent'
      when patch ? 'sponsorship_intent' then null
      else sponsorship_intent
    end,
    fields_of_interest = case
      when patch ? 'fields_of_interest' and jsonb_typeof(patch->'fields_of_interest') = 'array' then coalesce(
        (
          select array_agg(distinct left(trim(value), 120))
          from (
            select jsonb_array_elements_text(patch->'fields_of_interest') as value
            limit 8
          ) entries
          where trim(value) <> ''
        ),
        '{}'::text[]
      )
      else fields_of_interest
    end,
    message_privacy = case
      when patch ? 'message_privacy' and patch->>'message_privacy' in ('everyone', 'connections_only', 'followers_only')
        then patch->>'message_privacy'
      else message_privacy
    end,
    country = case
      when patch ? 'country' and patch->>'country' in ('bw', 'na', 'zw', 'zm', 'za')
        then patch->>'country'
      when patch ? 'country' then country
      else country
    end
  where id = uid
  returning * into result;

  return result;
end;
$$;

revoke all on function public.update_own_profile(jsonb) from public;
grant execute on function public.update_own_profile(jsonb) to authenticated;

notify pgrst, 'reload schema';
