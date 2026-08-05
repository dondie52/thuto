-- Student applications.
--
-- Two channels, one table:
--   hosted   — the institution has no portal of its own, so the student applies through Thuto
--              and the institution works the result in the CMS.
--   external — the institution runs its own portal. Thuto records that the student started an
--              application so they can track it, but the record stays private to the student.
--   manual   — the student added an application they made before finding Thuto.
--
-- The channel is what RLS keys on: institutions must never see external records, because the
-- student never consented to share them. That is the same line institution_leads already draws.
--
-- Reuses public.is_institution_user(text) from
-- 20260625150000_revenue_model_and_partners.sql (lines 81-93).

-- ---------------------------------------------------------------------------
-- 1. Per-institution application configuration
-- ---------------------------------------------------------------------------

create table if not exists public.institution_application_settings (
  institution_id text primary key
    references public.institution_partners (institution_id) on delete cascade,
  accepts_hosted_applications boolean not null default false,
  applications_open boolean not null default true,
  external_apply_url text,
  application_fee_amount numeric(10, 2)
    check (application_fee_amount is null or application_fee_amount >= 0),
  application_fee_currency text not null default 'BWP'
    check (char_length(application_fee_currency) = 3),
  application_fee_note text not null default '',
  -- Extra field keys beyond the always-on core set, e.g. ["guardian_name","sponsorship_status"]
  required_fields jsonb not null default '[]'::jsonb,
  -- [{ "key": "id_copy", "label": "Omang / national ID copy", "required": true }, ...]
  required_documents jsonb not null default '[]'::jsonb,
  max_programme_choices integer not null default 3
    check (max_programme_choices between 1 and 6),
  instructions text not null default '',
  notify_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ias_required_fields_is_array
    check (jsonb_typeof(required_fields) = 'array' and jsonb_array_length(required_fields) <= 30),
  constraint ias_required_documents_is_array
    check (jsonb_typeof(required_documents) = 'array' and jsonb_array_length(required_documents) <= 12),
  constraint ias_instructions_len check (char_length(instructions) <= 2000)
);

comment on table public.institution_application_settings is
  'Only partner institutions can accept Thuto-hosted applications. A non-partner has no row, and the client falls back to the external channel.';

-- ---------------------------------------------------------------------------
-- 2. The application record
-- ---------------------------------------------------------------------------

create table if not exists public.student_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  institution_id text not null,
  programme_id text,
  -- Programmes and institutions live in public/data/*.json, not in Postgres, so the names are
  -- snapshotted. A catalogue rename must not retroactively change what a student applied for.
  programme_name text not null default '',
  institution_name text not null default '',

  channel text not null default 'external'
    check (channel in ('hosted', 'external', 'manual')),
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'awaiting_interview', 'accepted', 'rejected', 'withdrawn')),

  form_data jsonb not null default '{}'::jsonb,
  -- [{ "key","label","storage_path","file_name","mime_type","file_size","uploaded_at" }]
  documents jsonb not null default '[]'::jsonb,

  consent_version text not null default 'v1',
  consent_at timestamptz,

  external_url text,
  external_first_clicked_at timestamptz,
  external_last_clicked_at timestamptz,
  external_click_count integer not null default 0 check (external_click_count >= 0),
  -- A student can choose to surface an external application to the institution. Off by default.
  shared_with_institution boolean not null default false,
  -- An apply click is intent, not a submission. Until the student confirms, the card reads
  -- "Started on the institution site" rather than claiming they applied.
  external_confirmed boolean not null default false,

  reference_code text,
  deadline date,
  source text not null default 'unknown'
    check (source in ('programme_detail', 'university_detail', 'predictor', 'saved', 'assistant', 'manual', 'unknown')),

  submitted_at timestamptz,
  decided_at timestamptz,
  status_changed_at timestamptz,
  status_changed_by uuid references auth.users (id) on delete set null,
  institution_message text not null default '',
  student_note text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sa_form_data_is_object check (jsonb_typeof(form_data) = 'object'),
  constraint sa_documents_is_array
    check (jsonb_typeof(documents) = 'array' and jsonb_array_length(documents) <= 12),
  constraint sa_institution_id_len check (char_length(institution_id) between 2 and 80),
  constraint sa_programme_name_len check (char_length(programme_name) <= 200),
  constraint sa_institution_name_len check (char_length(institution_name) <= 200),
  constraint sa_reference_code_len check (reference_code is null or char_length(reference_code) <= 60),
  constraint sa_institution_message_len check (char_length(institution_message) <= 1500),
  constraint sa_student_note_len check (char_length(student_note) <= 1000),
  constraint sa_external_url_len check (external_url is null or char_length(external_url) <= 2000),
  -- Only hosted applications have a draft stage; external records start as pending.
  constraint sa_draft_is_hosted check (status <> 'draft' or channel = 'hosted'),
  constraint sa_hosted_submission_complete check (
    channel <> 'hosted'
    or status = 'draft'
    or (consent_at is not null and submitted_at is not null)
  )
);

create index if not exists student_applications_user_idx
  on public.student_applications (user_id, updated_at desc);

create index if not exists student_applications_institution_inbox_idx
  on public.student_applications (institution_id, status, submitted_at desc)
  where channel = 'hosted' and status <> 'draft';

create index if not exists student_applications_programme_idx
  on public.student_applications (programme_id)
  where programme_id is not null;

-- One live application per student per programme, so a second apply click updates rather than
-- duplicating.
create unique index if not exists student_applications_one_live_idx
  on public.student_applications (user_id, institution_id, coalesce(programme_id, ''))
  where status not in ('withdrawn', 'rejected');

-- ---------------------------------------------------------------------------
-- 3. Timeline, and where staff-only notes live
-- ---------------------------------------------------------------------------

create table if not exists public.student_application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.student_applications (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  actor_role text not null default 'student'
    check (actor_role in ('student', 'institution', 'system')),
  event_type text not null
    check (event_type in ('created', 'submitted', 'status_changed', 'note', 'document_added', 'withdrawn', 'apply_click')),
  from_status text,
  to_status text,
  message text not null default '',
  visible_to_student boolean not null default true,
  created_at timestamptz not null default now(),
  constraint sae_message_len check (char_length(message) <= 1500)
);

create index if not exists student_application_events_app_idx
  on public.student_application_events (application_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_student_applications_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_applications_updated_at on public.student_applications;
create trigger student_applications_updated_at
  before update on public.student_applications
  for each row execute function public.set_student_applications_updated_at();

drop trigger if exists institution_application_settings_updated_at on public.institution_application_settings;
create trigger institution_application_settings_updated_at
  before update on public.institution_application_settings
  for each row execute function public.set_student_applications_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Write guard
--
-- RLS decides WHO may update a row; this decides WHAT they may change. Without it the student's
-- own-row policy would let them set status = 'accepted' on their own hosted application.
-- Anything that later adds a security-definer write path bypasses this trigger — don't.
-- ---------------------------------------------------------------------------

create or replace function public.guard_student_application_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  is_staff boolean := public.is_institution_user(old.institution_id);
  is_admin boolean := exists (select 1 from public.feed_admins where user_id = uid);
begin
  if new.user_id is distinct from old.user_id
     or new.institution_id is distinct from old.institution_id
     or new.channel is distinct from old.channel then
    raise exception 'Application identity columns are immutable' using errcode = '42501';
  end if;

  if is_staff or is_admin then
    -- Staff may move status, add a message, and set a reference code. Nothing else.
    new.form_data := old.form_data;
    new.documents := old.documents;
    new.student_note := old.student_note;
    new.programme_id := old.programme_id;
    new.consent_at := old.consent_at;
    new.deadline := old.deadline;
    if old.channel <> 'hosted' or old.status = 'draft' then
      raise exception 'Institutions can only act on submitted hosted applications' using errcode = '42501';
    end if;
    if new.status not in ('pending', 'awaiting_interview', 'accepted', 'rejected') then
      raise exception 'Unsupported status transition' using errcode = '22023';
    end if;
    new.status_changed_by := uid;
  elsif uid = old.user_id then
    if old.channel = 'hosted' then
      -- The student may submit a draft or withdraw. They may never decide their own outcome.
      if new.status is distinct from old.status
         and not (
           (old.status = 'draft' and new.status = 'pending')
           or new.status = 'withdrawn'
         ) then
        raise exception 'Only the institution can change this status' using errcode = '42501';
      end if;
      new.institution_message := old.institution_message;
      new.reference_code := coalesce(old.reference_code, new.reference_code);
    end if;
    -- external / manual records are the student's own bookkeeping; they set status freely.
    new.status_changed_by := uid;
  end if;

  if new.status is distinct from old.status then
    new.status_changed_at := now();
    if new.status in ('accepted', 'rejected') then
      new.decided_at := now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists student_applications_guard_update on public.student_applications;
create trigger student_applications_guard_update
  before update on public.student_applications
  for each row execute function public.guard_student_application_update();

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------

alter table public.institution_application_settings enable row level security;
alter table public.student_applications enable row level security;
alter table public.student_application_events enable row level security;

grant select on table public.institution_application_settings to anon, authenticated;
grant insert, update on table public.institution_application_settings to authenticated;
-- No DELETE grant on applications: withdraw, don't erase. The record is the student's history.
grant select, insert, update on table public.student_applications to authenticated;
grant select, insert on table public.student_application_events to authenticated;

drop policy if exists ias_public_read on public.institution_application_settings;
create policy ias_public_read on public.institution_application_settings
  for select using (true);

drop policy if exists ias_institution_write on public.institution_application_settings;
create policy ias_institution_write on public.institution_application_settings
  for all
  to authenticated
  using (
    public.is_institution_user(institution_id)
    or exists (select 1 from public.feed_admins where feed_admins.user_id = (select auth.uid()))
  )
  with check (
    public.is_institution_user(institution_id)
    or exists (select 1 from public.feed_admins where feed_admins.user_id = (select auth.uid()))
  );

-- Mirrors user_bookmarks_own (20260522000000_profiles_and_premium.sql:83-85).
drop policy if exists student_applications_own on public.student_applications;
create policy student_applications_own on public.student_applications
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists student_applications_institution_read on public.student_applications;
create policy student_applications_institution_read on public.student_applications
  for select
  to authenticated
  using (
    status <> 'draft'
    and (channel = 'hosted' or shared_with_institution)
    and (
      public.is_institution_user(institution_id)
      or exists (select 1 from public.feed_admins where feed_admins.user_id = (select auth.uid()))
    )
  );

drop policy if exists student_applications_institution_update on public.student_applications;
create policy student_applications_institution_update on public.student_applications
  for update
  to authenticated
  using (
    channel = 'hosted' and status <> 'draft'
    and (
      public.is_institution_user(institution_id)
      or exists (select 1 from public.feed_admins where feed_admins.user_id = (select auth.uid()))
    )
  )
  with check (
    channel = 'hosted' and status <> 'draft'
    and (
      public.is_institution_user(institution_id)
      or exists (select 1 from public.feed_admins where feed_admins.user_id = (select auth.uid()))
    )
  );

drop policy if exists student_application_events_read on public.student_application_events;
create policy student_application_events_read on public.student_application_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.student_applications a
      where a.id = application_id
        and (
          (a.user_id = (select auth.uid()) and visible_to_student)
          or public.is_institution_user(a.institution_id)
          or exists (select 1 from public.feed_admins where feed_admins.user_id = (select auth.uid()))
        )
    )
  );

drop policy if exists student_application_events_insert on public.student_application_events;
create policy student_application_events_insert on public.student_application_events
  for insert
  to authenticated
  with check (
    actor_id = (select auth.uid())
    and exists (
      select 1 from public.student_applications a
      where a.id = application_id
        and (a.user_id = (select auth.uid()) or public.is_institution_user(a.institution_id))
    )
  );

-- ---------------------------------------------------------------------------
-- 7. Submission RPC — the abuse choke point
-- ---------------------------------------------------------------------------

create or replace function public.submit_student_application(p_application_id uuid)
returns public.student_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := (select auth.uid());
  app public.student_applications;
  settings public.institution_application_settings;
  recent integer;
  live integer;
begin
  if uid is null then
    raise exception 'Sign in required' using errcode = '28000';
  end if;

  select * into app from public.student_applications
   where id = p_application_id and user_id = uid for update;
  if app.id is null then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if app.channel <> 'hosted' or app.status <> 'draft' then
    raise exception 'This application cannot be submitted' using errcode = '22023';
  end if;

  -- Re-checked server-side so a client that bypasses the UI still fails.
  select * into settings from public.institution_application_settings
   where institution_id = app.institution_id;
  if settings.institution_id is null
     or not settings.accepts_hosted_applications
     or not settings.applications_open then
    raise exception 'This institution is not accepting Thuto applications' using errcode = '22023';
  end if;

  select count(*) into recent from public.student_applications
   where user_id = uid and submitted_at > now() - interval '24 hours';
  if recent >= 10 then
    raise exception 'Daily application limit reached. Try again tomorrow.' using errcode = '54000';
  end if;

  select count(*) into live from public.student_applications
   where user_id = uid and status in ('pending', 'awaiting_interview');
  if live >= 25 then
    raise exception 'Too many open applications' using errcode = '54000';
  end if;

  update public.student_applications
     set status = 'pending',
         submitted_at = now(),
         consent_at = coalesce(consent_at, now())
   where id = p_application_id
   returning * into app;

  insert into public.student_application_events
    (application_id, actor_id, actor_role, event_type, from_status, to_status)
  values (p_application_id, uid, 'student', 'submitted', 'draft', 'pending');

  return app;
end;
$$;

revoke all on function public.submit_student_application(uuid) from public;
grant execute on function public.submit_student_application(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Applicant documents — private bucket, modelled on thuto-center-docs
--    (20260629120000_thuto_center.sql).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-documents', 'application-documents', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Joins through the application so staff at institution A cannot read a document attached to an
-- application at institution B.
create or replace function public.application_document_visible_to_institution(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_applications a
    where a.channel = 'hosted'
      and a.status <> 'draft'
      and public.is_institution_user(a.institution_id)
      and exists (
        select 1 from jsonb_array_elements(a.documents) d
        where d->>'storage_path' = p_path
      )
  );
$$;

grant execute on function public.application_document_visible_to_institution(text) to authenticated;

drop policy if exists application_documents_insert_own on storage.objects;
create policy application_documents_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'application-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists application_documents_select_authorized on storage.objects;
create policy application_documents_select_authorized on storage.objects
  for select to authenticated
  using (
    bucket_id = 'application-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.application_document_visible_to_institution(name)
      or exists (select 1 from public.feed_admins where feed_admins.user_id = (select auth.uid()))
    )
  );

drop policy if exists application_documents_delete_own on storage.objects;
create policy application_documents_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'application-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- 9. Seed settings for existing partners, hosted applications off by default
-- ---------------------------------------------------------------------------

insert into public.institution_application_settings (institution_id)
select institution_id from public.institution_partners
on conflict (institution_id) do nothing;

notify pgrst, 'reload schema';
