-- Feed social: notifications, direct messages, and connection requests.
-- Prerequisite migration: 20260609120000_feed_personalization.sql (creates user_follows).
-- The bootstrap below lets this file run safely in the SQL editor if that migration was skipped.

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  actor_display_name text,
  actor_username text,
  actor_avatar_url text,
  type text not null check (
    type in ('follow', 'connection_request', 'connection_accepted', 'comment', 'reaction', 'mention', 'post')
  ),
  target_type text,
  target_id uuid,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_unread_idx
  on public.user_notifications (user_id)
  where read_at is null;

alter table public.user_notifications enable row level security;

drop policy if exists user_notifications_select_own on public.user_notifications;
create policy user_notifications_select_own on public.user_notifications
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_notifications_update_own on public.user_notifications;
create policy user_notifications_update_own on public.user_notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.connection_requests (
  requester_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (requester_id, recipient_id),
  constraint connection_requests_not_self check (requester_id <> recipient_id)
);

create index if not exists connection_requests_recipient_status_idx
  on public.connection_requests (recipient_id, status, created_at desc);

alter table public.connection_requests enable row level security;

drop policy if exists connection_requests_select_participant on public.connection_requests;
create policy connection_requests_select_participant on public.connection_requests
  for select to authenticated
  using ((select auth.uid()) in (requester_id, recipient_id));

drop policy if exists connection_requests_insert_requester on public.connection_requests;
create policy connection_requests_insert_requester on public.connection_requests
  for insert to authenticated
  with check ((select auth.uid()) = requester_id);

drop policy if exists connection_requests_update_participant on public.connection_requests;
create policy connection_requests_update_participant on public.connection_requests
  for update to authenticated
  using ((select auth.uid()) in (requester_id, recipient_id))
  with check ((select auth.uid()) in (requester_id, recipient_id));

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  unread_count integer not null default 0 check (unread_count >= 0),
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_idx
  on public.conversation_members (user_id, conversation_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists conversations_select_member on public.conversations;
create policy conversations_select_member on public.conversations
  for select to authenticated
  using (
    exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = conversations.id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists conversation_members_select_own on public.conversation_members;
create policy conversation_members_select_own on public.conversation_members
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists conversation_members_update_own on public.conversation_members;
create policy conversation_members_update_own on public.conversation_members
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists messages_select_member on public.messages;
create policy messages_select_member on public.messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender on public.messages
  for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = (select auth.uid())
    )
  );

create table if not exists public.user_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint user_follows_not_self check (follower_id <> following_id)
);

create index if not exists user_follows_following_idx
  on public.user_follows (following_id, created_at desc);

alter table public.user_follows enable row level security;

drop policy if exists user_follows_select on public.user_follows;
create policy user_follows_select on public.user_follows
  for select to authenticated
  using (true);

drop policy if exists user_follows_mutate on public.user_follows;
create policy user_follows_mutate on public.user_follows
  for all to authenticated
  using ((select auth.uid()) = follower_id)
  with check ((select auth.uid()) = follower_id);

create or replace function public.notify_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor record;
begin
  select full_name, username, avatar_url
  into actor
  from public.profiles
  where id = new.follower_id;

  insert into public.user_notifications (
    user_id,
    actor_id,
    actor_display_name,
    actor_username,
    actor_avatar_url,
    type,
    body
  )
  values (
    new.following_id,
    new.follower_id,
    coalesce(actor.full_name, 'Someone'),
    actor.username,
    actor.avatar_url,
    'follow',
    coalesce(actor.full_name, 'Someone') || ' started following you'
  );

  return new;
end;
$$;

drop trigger if exists user_follows_notify on public.user_follows;
create trigger user_follows_notify
  after insert on public.user_follows
  for each row execute function public.notify_follow();

grant select, insert, delete on table public.user_follows to authenticated;

create or replace function public.notify_connection_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor record;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select full_name, username, avatar_url
  into actor
  from public.profiles
  where id = new.requester_id;

  insert into public.user_notifications (
    user_id,
    actor_id,
    actor_display_name,
    actor_username,
    actor_avatar_url,
    type,
    body
  )
  values (
    new.recipient_id,
    new.requester_id,
    coalesce(actor.full_name, 'Someone'),
    actor.username,
    actor.avatar_url,
    'connection_request',
    coalesce(actor.full_name, 'Someone') || ' sent you a connection request'
  );

  return new;
end;
$$;

drop trigger if exists connection_requests_notify on public.connection_requests;
create trigger connection_requests_notify
  after insert on public.connection_requests
  for each row execute function public.notify_connection_request();

create or replace function public.bump_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;

  update public.conversation_members
  set unread_count = unread_count + 1
  where conversation_id = new.conversation_id
    and user_id <> new.sender_id;

  return new;
end;
$$;

drop trigger if exists messages_bump_conversation on public.messages;
create trigger messages_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation_on_message();

create or replace function public.get_or_create_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing uuid;
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

  insert into public.conversations default values returning id into existing;
  insert into public.conversation_members (conversation_id, user_id) values (existing, me), (existing, p_other_user_id);
  return existing;
end;
$$;

create or replace function public.list_my_conversations(p_limit integer default 30)
returns table (
  id uuid,
  other_user_id uuid,
  other_display_name text,
  other_username text,
  other_avatar_url text,
  last_message text,
  last_message_at timestamptz,
  unread_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  with mine as (
    select conversation_id, unread_count
    from public.conversation_members
    where user_id = auth.uid()
  ),
  others as (
    select cm.conversation_id, cm.user_id as other_user_id
    from public.conversation_members cm
    join mine on mine.conversation_id = cm.conversation_id
    where cm.user_id <> auth.uid()
  ),
  last_msg as (
    select distinct on (m.conversation_id)
      m.conversation_id,
      m.body as last_message,
      m.created_at as last_message_at
    from public.messages m
    join mine on mine.conversation_id = m.conversation_id
    order by m.conversation_id, m.created_at desc
  )
  select
    c.id,
    o.other_user_id,
    p.full_name,
    p.username,
    p.avatar_url,
    coalesce(lm.last_message, ''),
    lm.last_message_at,
    mine.unread_count
  from mine
  join public.conversations c on c.id = mine.conversation_id
  join others o on o.conversation_id = mine.conversation_id
  left join public.profiles p on p.id = o.other_user_id
  left join last_msg lm on lm.conversation_id = mine.conversation_id
  order by coalesce(lm.last_message_at, c.updated_at, c.created_at) desc
  limit greatest(p_limit, 1);
$$;

create or replace function public.get_unread_message_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(unread_count), 0)::integer
  from public.conversation_members
  where user_id = auth.uid();
$$;

grant select, update on table public.user_notifications to authenticated;
grant select, insert, update on table public.connection_requests to authenticated;
grant select on table public.conversations to authenticated;
grant select, update on table public.conversation_members to authenticated;
grant select, insert on table public.messages to authenticated;

grant execute on function public.get_or_create_conversation(uuid) to authenticated;
grant execute on function public.list_my_conversations(integer) to authenticated;
grant execute on function public.get_unread_message_count() to authenticated;

grant all on table public.user_notifications to service_role;
grant all on table public.connection_requests to service_role;
grant all on table public.conversations to service_role;
grant all on table public.conversation_members to service_role;
grant all on table public.messages to service_role;
