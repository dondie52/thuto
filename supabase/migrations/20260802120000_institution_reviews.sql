-- Student reviews of institutions: a 1-5 star rating plus a short written review.
-- Students own their review; institutions can reply but never edit or delete what a student wrote.

create table if not exists public.institution_reviews (
  id uuid primary key default gen_random_uuid(),
  institution_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null,
  body text not null default '',
  status text not null default 'published',
  reply text,
  replied_at timestamptz,
  replied_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One review per student per institution; editing replaces it.
  unique (institution_id, user_id),
  constraint institution_reviews_rating_range check (rating between 1 and 5),
  -- ~100 words. Enforced again in the client, which counts words rather than characters.
  constraint institution_reviews_body_len check (char_length(body) <= 900),
  constraint institution_reviews_reply_len check (reply is null or char_length(reply) between 1 and 1200),
  constraint institution_reviews_status_check check (status in ('published', 'hidden'))
);

create index if not exists institution_reviews_institution_idx
  on public.institution_reviews (institution_id, status, created_at desc);

create index if not exists institution_reviews_user_idx
  on public.institution_reviews (user_id);

create or replace function public.set_institution_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists institution_reviews_updated_at on public.institution_reviews;
create trigger institution_reviews_updated_at
  before update on public.institution_reviews
  for each row execute function public.set_institution_reviews_updated_at();

alter table public.institution_reviews enable row level security;

grant select on table public.institution_reviews to anon, authenticated;
grant insert, update, delete on table public.institution_reviews to authenticated;

-- Anyone can read published reviews.
drop policy if exists institution_reviews_public_read on public.institution_reviews;
create policy institution_reviews_public_read on public.institution_reviews
  for select
  using (status = 'published' or user_id = auth.uid());

-- A signed-in student writes their own review, and only their own.
drop policy if exists institution_reviews_author_insert on public.institution_reviews;
create policy institution_reviews_author_insert on public.institution_reviews
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists institution_reviews_author_update on public.institution_reviews;
create policy institution_reviews_author_update on public.institution_reviews
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists institution_reviews_author_delete on public.institution_reviews;
create policy institution_reviews_author_delete on public.institution_reviews
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Institutions reply through this function only. There is deliberately no update policy that
-- would let an institution touch a student's rating or body: column-level restrictions are not
-- expressible in a policy, so the write is funnelled through a definer function instead.
create or replace function public.reply_to_institution_review(p_review_id uuid, p_reply text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_institution_id text;
  v_reply text := nullif(btrim(coalesce(p_reply, '')), '');
begin
  select institution_id into v_institution_id
  from public.institution_reviews
  where id = p_review_id;

  if v_institution_id is null then
    raise exception 'Review not found.';
  end if;

  if not public.is_institution_user(v_institution_id) then
    raise exception 'Not authorised to reply for this institution.';
  end if;

  if v_reply is not null and char_length(v_reply) > 1200 then
    raise exception 'Reply is too long.';
  end if;

  update public.institution_reviews
  set reply = v_reply,
      replied_at = case when v_reply is null then null else now() end,
      replied_by = case when v_reply is null then null else auth.uid() end
  where id = p_review_id;
end;
$$;

grant execute on function public.reply_to_institution_review(uuid, text) to authenticated;

-- Aggregate ratings without exposing individual rows, for list and card surfaces.
create or replace function public.institution_review_summary(p_institution_ids text[])
returns table (institution_id text, review_count bigint, average_rating numeric)
language sql
stable
security definer
set search_path = public
as $$
  select r.institution_id,
         count(*)::bigint,
         round(avg(r.rating)::numeric, 2)
  from public.institution_reviews r
  where r.status = 'published'
    and r.institution_id = any(p_institution_ids)
  group by r.institution_id;
$$;

grant execute on function public.institution_review_summary(text[]) to anon, authenticated;
