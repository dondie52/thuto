-- Keep Pro badge flags consistent across feed comments, notifications, and messaging lists.

alter table public.feed_comments
  add column if not exists author_is_pro boolean not null default false;

alter table public.user_notifications
  add column if not exists actor_is_pro boolean not null default false;

update public.feed_comments fc
set author_is_pro = public.profile_is_pro_active(p.premium_status, p.premium_until)
from public.profiles p
where p.id = fc.author_id;

update public.user_notifications un
set actor_is_pro = public.profile_is_pro_active(p.premium_status, p.premium_until)
from public.profiles p
where p.id = un.actor_id;

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

    update public.feed_comments
    set author_is_pro = v_is_pro
    where author_id = new.id;
  end if;
  return new;
end;
$$;

create or replace function public.notify_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor record;
begin
  select full_name, username, avatar_url, premium_status, premium_until
  into actor
  from public.profiles
  where id = new.follower_id;

  insert into public.user_notifications (
    user_id,
    actor_id,
    actor_display_name,
    actor_username,
    actor_avatar_url,
    actor_is_pro,
    type,
    body
  )
  values (
    new.following_id,
    new.follower_id,
    coalesce(actor.full_name, 'Someone'),
    actor.username,
    actor.avatar_url,
    public.profile_is_pro_active(actor.premium_status, actor.premium_until),
    'follow',
    coalesce(actor.full_name, 'Someone') || ' started following you'
  );

  return new;
end;
$$;

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

  select full_name, username, avatar_url, premium_status, premium_until
  into actor
  from public.profiles
  where id = new.requester_id;

  insert into public.user_notifications (
    user_id,
    actor_id,
    actor_display_name,
    actor_username,
    actor_avatar_url,
    actor_is_pro,
    type,
    body
  )
  values (
    new.recipient_id,
    new.requester_id,
    coalesce(actor.full_name, 'Someone'),
    actor.username,
    actor.avatar_url,
    public.profile_is_pro_active(actor.premium_status, actor.premium_until),
    'connection_request',
    coalesce(actor.full_name, 'Someone') || ' sent you a connection request'
  );

  return new;
end;
$$;

create or replace function public.list_my_conversations(p_limit integer default 30)
returns table (
  id uuid,
  other_user_id uuid,
  other_display_name text,
  other_username text,
  other_avatar_url text,
  other_is_pro boolean,
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
    public.profile_is_pro_active(p.premium_status, p.premium_until),
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

create or replace function public.notify_feed_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  actor record;
begin
  if new.status <> 'published' then
    return new;
  end if;

  select author_id into post_author from public.feed_posts where id = new.post_id;
  if post_author is null or post_author = new.author_id then
    return new;
  end if;

  select full_name, username, avatar_url, premium_status, premium_until
  into actor
  from public.profiles
  where id = new.author_id;

  insert into public.user_notifications (
    user_id, actor_id, actor_display_name, actor_username, actor_avatar_url, actor_is_pro, type, target_type, target_id, body
  ) values (
    post_author,
    new.author_id,
    coalesce(actor.full_name, 'Someone'),
    actor.username,
    actor.avatar_url,
    public.profile_is_pro_active(actor.premium_status, actor.premium_until),
    'comment',
    'post',
    new.post_id,
    coalesce(actor.full_name, 'Someone') || ' commented on your post'
  );

  return new;
end;
$$;

create or replace function public.notify_feed_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  actor record;
begin
  select author_id into post_author from public.feed_posts where id = new.post_id;
  if post_author is null or post_author = new.user_id then
    return new;
  end if;

  select full_name, username, avatar_url, premium_status, premium_until
  into actor
  from public.profiles
  where id = new.user_id;

  insert into public.user_notifications (
    user_id, actor_id, actor_display_name, actor_username, actor_avatar_url, actor_is_pro, type, target_type, target_id, body
  ) values (
    post_author,
    new.user_id,
    coalesce(actor.full_name, 'Someone'),
    actor.username,
    actor.avatar_url,
    public.profile_is_pro_active(actor.premium_status, actor.premium_until),
    'reaction',
    'post',
    new.post_id,
    coalesce(actor.full_name, 'Someone') || ' reacted to your post'
  );

  return new;
end;
$$;

create or replace function public.notify_connection_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor record;
begin
  if old.status = 'pending' and new.status = 'accepted' then
    select full_name, username, avatar_url, premium_status, premium_until
    into actor
    from public.profiles
    where id = new.recipient_id;

    insert into public.user_notifications (
      user_id, actor_id, actor_display_name, actor_username, actor_avatar_url, actor_is_pro, type, body
    ) values (
      new.requester_id,
      new.recipient_id,
      coalesce(actor.full_name, 'Someone'),
      actor.username,
      actor.avatar_url,
      public.profile_is_pro_active(actor.premium_status, actor.premium_until),
      'connection_accepted',
      coalesce(actor.full_name, 'Someone') || ' accepted your connection request'
    );
  end if;

  return new;
end;
$$;

create or replace function public.bump_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  actor record;
begin
  update public.conversations
  set updated_at = new.created_at
  where id = new.conversation_id;

  for recipient in
    select user_id
    from public.conversation_members
    where conversation_id = new.conversation_id
      and user_id <> new.sender_id
  loop
    update public.conversation_members
    set unread_count = unread_count + 1
    where conversation_id = new.conversation_id
      and user_id = recipient;

    select full_name, username, avatar_url, premium_status, premium_until
    into actor
    from public.profiles
    where id = new.sender_id;

    insert into public.user_notifications (
      user_id, actor_id, actor_display_name, actor_username, actor_avatar_url, actor_is_pro, type, target_type, target_id, body
    ) values (
      recipient,
      new.sender_id,
      coalesce(actor.full_name, 'Someone'),
      actor.username,
      actor.avatar_url,
      public.profile_is_pro_active(actor.premium_status, actor.premium_until),
      'message',
      'conversation',
      new.conversation_id,
      coalesce(actor.full_name, 'Someone') || ' sent you a message'
    );
  end loop;

  return new;
end;
$$;
