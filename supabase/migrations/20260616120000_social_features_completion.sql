-- Social features completion: notifications, message privacy, saved posts.

alter table public.user_notifications drop constraint if exists user_notifications_type_check;
alter table public.user_notifications add constraint user_notifications_type_check check (
  type in ('follow', 'connection_request', 'connection_accepted', 'comment', 'reaction', 'mention', 'post', 'message')
);

alter table public.profiles
  add column if not exists message_privacy text not null default 'everyone'
  check (message_privacy in ('everyone', 'connections_only', 'followers_only'));

create table if not exists public.saved_posts (
  user_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists saved_posts_user_created_idx
  on public.saved_posts (user_id, created_at desc);

alter table public.saved_posts enable row level security;

drop policy if exists saved_posts_select_own on public.saved_posts;
create policy saved_posts_select_own on public.saved_posts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists saved_posts_insert_own on public.saved_posts;
create policy saved_posts_insert_own on public.saved_posts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists saved_posts_delete_own on public.saved_posts;
create policy saved_posts_delete_own on public.saved_posts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on table public.saved_posts to authenticated;
grant all on table public.saved_posts to service_role;

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

  select full_name, username, avatar_url into actor from public.profiles where id = new.author_id;

  insert into public.user_notifications (
    user_id, actor_id, actor_display_name, actor_username, actor_avatar_url, type, target_type, target_id, body
  ) values (
    post_author,
    new.author_id,
    coalesce(actor.full_name, 'Someone'),
    actor.username,
    actor.avatar_url,
    'comment',
    'post',
    new.post_id,
    coalesce(actor.full_name, 'Someone') || ' commented on your post'
  );

  return new;
end;
$$;

drop trigger if exists feed_comments_notify on public.feed_comments;
create trigger feed_comments_notify
  after insert on public.feed_comments
  for each row execute function public.notify_feed_comment();

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

  select full_name, username, avatar_url into actor from public.profiles where id = new.user_id;

  insert into public.user_notifications (
    user_id, actor_id, actor_display_name, actor_username, actor_avatar_url, type, target_type, target_id, body
  ) values (
    post_author,
    new.user_id,
    coalesce(actor.full_name, 'Someone'),
    actor.username,
    actor.avatar_url,
    'reaction',
    'post',
    new.post_id,
    coalesce(actor.full_name, 'Someone') || ' reacted to your post'
  );

  return new;
end;
$$;

drop trigger if exists feed_reactions_notify on public.feed_reactions;
create trigger feed_reactions_notify
  after insert on public.feed_reactions
  for each row execute function public.notify_feed_reaction();

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
    select full_name, username, avatar_url into actor from public.profiles where id = new.recipient_id;

    insert into public.user_notifications (
      user_id, actor_id, actor_display_name, actor_username, actor_avatar_url, type, body
    ) values (
      new.requester_id,
      new.recipient_id,
      coalesce(actor.full_name, 'Someone'),
      actor.username,
      actor.avatar_url,
      'connection_accepted',
      coalesce(actor.full_name, 'Someone') || ' accepted your connection request'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists connection_requests_accepted_notify on public.connection_requests;
create trigger connection_requests_accepted_notify
  after update on public.connection_requests
  for each row execute function public.notify_connection_accepted();

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

    select full_name, username, avatar_url into actor from public.profiles where id = new.sender_id;

    insert into public.user_notifications (
      user_id, actor_id, actor_display_name, actor_username, actor_avatar_url, type, target_type, target_id, body
    ) values (
      recipient,
      new.sender_id,
      coalesce(actor.full_name, 'Someone'),
      actor.username,
      actor.avatar_url,
      'message',
      'conversation',
      new.conversation_id,
      coalesce(actor.full_name, 'Someone') || ' sent you a message'
    );
  end loop;

  return new;
end;
$$;

create or replace function public.can_message_user(sender_id uuid, recipient_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select case coalesce(p.message_privacy, 'everyone')
    when 'everyone' then true
    when 'connections_only' then exists (
      select 1
      from public.connection_requests cr
      where cr.status = 'accepted'
        and (
          (cr.requester_id = sender_id and cr.recipient_id = recipient_id)
          or (cr.requester_id = recipient_id and cr.recipient_id = sender_id)
        )
    )
    when 'followers_only' then (
      exists (
        select 1
        from public.user_follows uf
        where (uf.follower_id = sender_id and uf.following_id = recipient_id)
           or (uf.follower_id = recipient_id and uf.following_id = sender_id)
      )
      or exists (
        select 1
        from public.connection_requests cr
        where cr.status = 'accepted'
          and (
            (cr.requester_id = sender_id and cr.recipient_id = recipient_id)
            or (cr.requester_id = recipient_id and cr.recipient_id = sender_id)
          )
      )
    )
    else true
  end
  from public.profiles p
  where p.id = recipient_id;
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

  if not public.can_message_user(me, p_other_user_id) then
    raise exception 'This person only accepts messages from selected contacts.';
  end if;

  insert into public.conversations default values returning id into existing;
  insert into public.conversation_members (conversation_id, user_id) values (existing, me), (existing, p_other_user_id);
  return existing;
end;
$$;

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
    end
  where id = uid
  returning * into result;

  return result;
end;
$$;

notify pgrst, 'reload schema';
