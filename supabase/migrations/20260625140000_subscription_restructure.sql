-- Thuto subscription restructure: yearly / five-year plans, assistant usage, free messaging rules.

alter table public.profiles drop constraint if exists profiles_premium_plan_check;

alter table public.profiles
  add constraint profiles_premium_plan_check
  check (
    premium_plan is null
    or premium_plan in ('yearly', 'five_year', 'monthly', 'annual', 'season_pass')
  );

update public.profiles
set premium_plan = 'yearly'
where premium_plan = 'season_pass';

create table if not exists public.assistant_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default current_date,
  question_count integer not null default 0 check (question_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.assistant_daily_usage enable row level security;

drop policy if exists assistant_daily_usage_own on public.assistant_daily_usage;
create policy assistant_daily_usage_own on public.assistant_daily_usage
  for select using (auth.uid() = user_id);

create or replace function public.free_user_can_message(recipient_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_follows uf
    where uf.follower_id = recipient_id
      and uf.following_id = auth.uid()
  )
  or exists (
    select 1
    from public.connection_requests cr
    where cr.status = 'accepted'
      and (
        (cr.requester_id = auth.uid() and cr.recipient_id = recipient_id)
        or (cr.requester_id = recipient_id and cr.recipient_id = auth.uid())
      )
  );
$$;

create or replace function public.get_or_create_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing uuid;
  sender_pro boolean;
begin
  if me is null then
    raise exception 'Sign in to message people.';
  end if;
  if me = p_other_user_id then
    raise exception 'You cannot message yourself.';
  end if;

  select cm1.conversation_id
  into existing
  from public.conversation_members cm1
  join public.conversation_members cm2 on cm2.conversation_id = cm1.conversation_id
  where cm1.user_id = me
    and cm2.user_id = p_other_user_id
  limit 1;

  if existing is not null then
    return existing;
  end if;

  select public.profile_is_pro_active(p.premium_status, p.premium_until)
  into sender_pro
  from public.profiles p
  where p.id = me;

  if coalesce(sender_pro, false) then
    null;
  elsif not public.free_user_can_message(p_other_user_id) then
    raise exception 'Free accounts can only message people who follow you or accepted connections. Upgrade to Thuto Pro to message anyone.';
  end if;

  insert into public.conversations default values returning id into existing;
  insert into public.conversation_members (conversation_id, user_id) values (existing, me), (existing, p_other_user_id);
  return existing;
end;
$$;

create or replace function public.consume_assistant_question(p_limit integer default 3)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  current_count integer;
  effective_limit integer;
  sender_pro boolean;
begin
  if me is null then
    return jsonb_build_object('allowed', false, 'reason', 'auth_required', 'count', 0, 'limit', p_limit);
  end if;

  select public.profile_is_pro_active(p.premium_status, p.premium_until)
  into sender_pro
  from public.profiles p
  where p.id = me;

  if coalesce(sender_pro, false) then
    return jsonb_build_object('allowed', true, 'count', 0, 'limit', null, 'unlimited', true);
  end if;

  effective_limit := greatest(coalesce(p_limit, 3), 1);

  insert into public.assistant_daily_usage as usage (user_id, usage_date, question_count)
  values (me, current_date, 0)
  on conflict (user_id, usage_date) do nothing;

  select question_count
  into current_count
  from public.assistant_daily_usage
  where user_id = me
    and usage_date = current_date
  for update;

  if current_count >= effective_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit',
      'count', current_count,
      'limit', effective_limit
    );
  end if;

  update public.assistant_daily_usage
  set question_count = question_count + 1,
      updated_at = now()
  where user_id = me
    and usage_date = current_date;

  return jsonb_build_object(
    'allowed', true,
    'count', current_count + 1,
    'limit', effective_limit
  );
end;
$$;

create or replace function public.check_bookmark_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bookmark_count integer;
  sender_pro boolean;
begin
  select public.profile_is_pro_active(p.premium_status, p.premium_until)
  into sender_pro
  from public.profiles p
  where p.id = new.user_id;

  if coalesce(sender_pro, false) then
    return new;
  end if;

  select count(*)
  into bookmark_count
  from public.user_bookmarks
  where user_id = new.user_id;

  if bookmark_count >= 2 then
    raise exception 'Free accounts can save up to 2 programmes. Upgrade to Thuto Pro for unlimited saves.';
  end if;

  return new;
end;
$$;

drop trigger if exists user_bookmarks_limit_free on public.user_bookmarks;
create trigger user_bookmarks_limit_free
  before insert on public.user_bookmarks
  for each row execute function public.check_bookmark_limit();
