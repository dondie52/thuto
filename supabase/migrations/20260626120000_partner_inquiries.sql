-- Public partner inquiry form for /partners marketing page.

create table if not exists public.partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text not null,
  partner_type text not null default 'other'
    check (partner_type in ('university', 'tvet', 'employer', 'ngo', 'school', 'other')),
  message text,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'contacted', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_inquiries_name_len check (char_length(name) between 2 and 120),
  constraint partner_inquiries_email_len check (char_length(email) between 5 and 254),
  constraint partner_inquiries_organization_len check (char_length(organization) between 2 and 200),
  constraint partner_inquiries_message_len check (message is null or char_length(message) <= 5000)
);

create index if not exists partner_inquiries_status_created_idx
  on public.partner_inquiries (status, created_at desc);

drop trigger if exists partner_inquiries_updated_at on public.partner_inquiries;
create trigger partner_inquiries_updated_at
  before update on public.partner_inquiries
  for each row execute function public.set_page_content_updated_at();

alter table public.partner_inquiries enable row level security;

grant insert on table public.partner_inquiries to anon, authenticated;
grant select, update, delete on table public.partner_inquiries to authenticated;
grant select, insert, update, delete on table public.partner_inquiries to service_role;

drop policy if exists partner_inquiries_public_insert on public.partner_inquiries;
drop policy if exists partner_inquiries_admin_read on public.partner_inquiries;
drop policy if exists partner_inquiries_admin_update on public.partner_inquiries;
drop policy if exists partner_inquiries_admin_delete on public.partner_inquiries;

create policy partner_inquiries_public_insert on public.partner_inquiries
  for insert
  to anon, authenticated
  with check (
    status = 'new'
    and (user_id is null or user_id = (select auth.uid()))
  );

create policy partner_inquiries_admin_read on public.partner_inquiries
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

create policy partner_inquiries_admin_update on public.partner_inquiries
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

create policy partner_inquiries_admin_delete on public.partner_inquiries
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

notify pgrst, 'reload schema';
