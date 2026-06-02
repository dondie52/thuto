-- Ops superuser policies for the Thuto admin experience.
-- V1 source of truth: public.feed_admins membership.

create table if not exists public.feed_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.feed_admins is
  'Thuto ops superuser membership. Kept as the v1 source of truth for admin UI, RLS, and feed moderation.';

alter table public.feed_admins enable row level security;

grant select on table public.feed_admins to authenticated;
grant select, update on table public.profiles to authenticated;

drop policy if exists feed_admins_read_own on public.feed_admins;

create policy feed_admins_read_own on public.feed_admins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_select_own_or_superuser on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;
drop policy if exists profiles_update_superuser on public.profiles;

create policy profiles_select_own_or_superuser on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy profiles_update_own on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_update_superuser on public.profiles
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create or replace function public.protect_profile_superuser_fields()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_is_superuser boolean := false;
begin
  if new.id is distinct from old.id then
    raise exception 'Profile id cannot be changed.' using errcode = '42501';
  end if;

  if actor_id is null then
    return new;
  end if;

  if new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.payment_provider is distinct from old.payment_provider
    or new.premium_status is distinct from old.premium_status
    or new.premium_plan is distinct from old.premium_plan
    or new.premium_until is distinct from old.premium_until
  then
    select exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = actor_id
    )
    into actor_is_superuser;

    if not actor_is_superuser then
      raise exception 'Only Thuto superusers can change protected profile fields.' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_superuser_fields on public.profiles;

create trigger profiles_protect_superuser_fields
  before update on public.profiles
  for each row
  execute function public.protect_profile_superuser_fields();
