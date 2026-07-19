-- Market country for catalogue filtering (Botswana default; Namibia supported).

alter table public.profiles
  add column if not exists country text not null default 'bw';

alter table public.profiles
  drop constraint if exists profiles_country_check;

alter table public.profiles
  add constraint profiles_country_check
  check (country in ('bw', 'na'));

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
      when patch ? 'syllabus_type' and patch->>'syllabus_type' in ('bgcse', 'igcse', 'as_level', 'o_level')
        then patch->>'syllabus_type'
      when patch ? 'syllabus_type' then null
      else syllabus_type
    end,
    sponsorship_intent = case
      when patch ? 'sponsorship_intent' and patch->>'sponsorship_intent' in ('dtef', 'private', 'self_funded')
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
      when patch ? 'country' and patch->>'country' in ('bw', 'na')
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
