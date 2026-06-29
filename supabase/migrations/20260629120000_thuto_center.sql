-- Thuto Center: peer study materials library for Botswana tertiary students.
-- Free upload; downloads via unlock credits or Thuto Pro instant access.

create table if not exists public.center_documents (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  document_type text not null check (
    document_type in (
      'lecture_notes',
      'past_paper',
      'exam_answer',
      'study_summary',
      'assignment_guide',
      'other'
    )
  ),
  university_id text not null,
  university_name text not null default '',
  faculty text not null,
  course_code text not null,
  academic_year text,
  exam_session text,
  storage_path text not null,
  file_name text not null,
  file_size integer not null check (file_size > 0 and file_size <= 15728640),
  mime_type text not null,
  page_count integer,
  status text not null default 'pending_review' check (
    status in ('pending_review', 'published', 'rejected', 'removed')
  ),
  moderation_reason text,
  admin_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  removed_at timestamptz,
  policy_version text not null default 'bw-v1',
  policy_accepted_at timestamptz not null default now(),
  copyright_declaration boolean not null default false,
  download_count integer not null default 0,
  helpful_count integer not null default 0,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint center_documents_title_len check (char_length(trim(title)) between 3 and 160),
  constraint center_documents_description_len check (char_length(description) <= 800),
  constraint center_documents_faculty_len check (char_length(faculty) between 2 and 80),
  constraint center_documents_course_code_len check (char_length(trim(course_code)) between 2 and 32),
  constraint center_documents_university_id_len check (char_length(university_id) between 2 and 80),
  constraint center_documents_storage_path_len check (char_length(storage_path) <= 700),
  constraint center_documents_file_name_len check (char_length(file_name) between 1 and 200),
  constraint center_documents_copyright_required check (
    status = 'pending_review' or copyright_declaration = true
  )
);

create table if not exists public.center_upload_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits_balance integer not null default 0 check (credits_balance >= 0),
  lifetime_earned integer not null default 0,
  lifetime_spent integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.center_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.center_documents(id) on delete cascade,
  unlock_method text not null check (unlock_method in ('credit', 'pro', 'uploader')),
  created_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

create table if not exists public.center_helpful_votes (
  document_id uuid not null references public.center_documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (document_id, user_id)
);

create table if not exists public.center_reports (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.center_documents(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (
    reason in (
      'copyright',
      'not_original',
      'textbook_scan',
      'mislabeled',
      'spam',
      'unsafe',
      'other'
    )
  ),
  details text not null default '',
  created_at timestamptz not null default now(),
  unique (document_id, reporter_id),
  constraint center_reports_details_len check (char_length(details) <= 500)
);

create table if not exists public.center_policy_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version text not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, policy_version)
);

create index if not exists center_documents_public_idx
  on public.center_documents (status, university_id, faculty, course_code, published_at desc nulls last, created_at desc);

create index if not exists center_documents_uploader_idx
  on public.center_documents (uploader_id, created_at desc);

create index if not exists center_documents_admin_idx
  on public.center_documents (status, updated_at desc);

create index if not exists center_unlocks_document_idx
  on public.center_unlocks (document_id);

create index if not exists center_reports_document_idx
  on public.center_reports (document_id, created_at desc);

create or replace function public.set_center_documents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists center_documents_updated_at on public.center_documents;
create trigger center_documents_updated_at
  before update on public.center_documents
  for each row execute function public.set_center_documents_updated_at();

create or replace function public.center_is_premium_user(p_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and premium_until is not null
      and premium_until > now()
  );
$$;

create or replace function public.center_user_can_download(p_user_id uuid, p_document_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.center_documents d
    where d.id = p_document_id
      and d.status = 'published'
      and (
        d.uploader_id = p_user_id
        or public.center_is_premium_user(p_user_id)
        or exists (
          select 1
          from public.center_unlocks u
          where u.user_id = p_user_id
            and u.document_id = p_document_id
        )
        or exists (
          select 1
          from public.feed_admins a
          where a.user_id = p_user_id
        )
      )
  );
$$;

create or replace function public.center_award_upload_credits()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    insert into public.center_upload_credits (user_id, credits_balance, lifetime_earned)
    values (new.uploader_id, 3, 3)
    on conflict (user_id) do update
      set credits_balance = center_upload_credits.credits_balance + 3,
          lifetime_earned = center_upload_credits.lifetime_earned + 3,
          updated_at = now();

    insert into public.center_unlocks (user_id, document_id, unlock_method)
    values (new.uploader_id, new.id, 'uploader')
    on conflict (user_id, document_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists center_documents_award_credits on public.center_documents;
create trigger center_documents_award_credits
  after update of status on public.center_documents
  for each row execute function public.center_award_upload_credits();

create or replace function public.center_unlock_document(p_document_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_credits integer;
  v_status text;
begin
  if v_user_id is null then
    raise exception 'Sign in required';
  end if;

  select status into v_status
  from public.center_documents
  where id = p_document_id;

  if v_status is distinct from 'published' then
    return jsonb_build_object('ok', false, 'error', 'not_published');
  end if;

  if public.center_user_can_download(v_user_id, p_document_id) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  if public.center_is_premium_user(v_user_id) then
    insert into public.center_unlocks (user_id, document_id, unlock_method)
    values (v_user_id, p_document_id, 'pro')
    on conflict (user_id, document_id) do nothing;
    return jsonb_build_object('ok', true, 'method', 'pro');
  end if;

  select credits_balance into v_credits
  from public.center_upload_credits
  where user_id = v_user_id;

  v_credits := coalesce(v_credits, 0);

  if v_credits < 1 then
    return jsonb_build_object('ok', false, 'error', 'no_credits');
  end if;

  update public.center_upload_credits
  set credits_balance = credits_balance - 1,
      lifetime_spent = lifetime_spent + 1,
      updated_at = now()
  where user_id = v_user_id;

  insert into public.center_unlocks (user_id, document_id, unlock_method)
  values (v_user_id, p_document_id, 'credit');

  return jsonb_build_object(
    'ok', true,
    'method', 'credit',
    'credits_remaining', greatest(v_credits - 1, 0)
  );
end;
$$;

create or replace function public.center_record_download(p_document_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Sign in required';
  end if;

  if not public.center_user_can_download(v_user_id, p_document_id) then
    raise exception 'Download not permitted';
  end if;

  update public.center_documents
  set download_count = download_count + 1
  where id = p_document_id
    and status = 'published';
end;
$$;

create or replace function public.center_toggle_helpful(p_document_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_added boolean := false;
begin
  if v_user_id is null then
    raise exception 'Sign in required';
  end if;

  if not exists (
    select 1
    from public.center_documents
    where id = p_document_id
      and status = 'published'
  ) then
    raise exception 'Document not found';
  end if;

  if exists (
    select 1
    from public.center_helpful_votes
    where document_id = p_document_id
      and user_id = v_user_id
  ) then
    delete from public.center_helpful_votes
    where document_id = p_document_id
      and user_id = v_user_id;

    update public.center_documents
    set helpful_count = greatest(helpful_count - 1, 0)
    where id = p_document_id;
  else
    insert into public.center_helpful_votes (document_id, user_id)
    values (p_document_id, v_user_id);

    update public.center_documents
    set helpful_count = helpful_count + 1
    where id = p_document_id;

    v_added := true;
  end if;

  return jsonb_build_object('ok', true, 'helpful', v_added);
end;
$$;

alter table public.center_documents enable row level security;
alter table public.center_upload_credits enable row level security;
alter table public.center_unlocks enable row level security;
alter table public.center_helpful_votes enable row level security;
alter table public.center_reports enable row level security;
alter table public.center_policy_acceptances enable row level security;

grant select, insert, update on table public.center_documents to authenticated;
grant select on table public.center_documents to anon;
grant select, insert, update on table public.center_upload_credits to authenticated;
grant select, insert on table public.center_unlocks to authenticated;
grant select, insert, delete on table public.center_helpful_votes to authenticated;
grant select, insert on table public.center_reports to authenticated;
grant select, insert on table public.center_policy_acceptances to authenticated;

grant execute on function public.center_is_premium_user(uuid) to authenticated;
grant execute on function public.center_user_can_download(uuid, uuid) to authenticated;
grant execute on function public.center_unlock_document(uuid) to authenticated;
grant execute on function public.center_record_download(uuid) to authenticated;
grant execute on function public.center_toggle_helpful(uuid) to authenticated;

drop policy if exists center_documents_read_public_metadata on public.center_documents;
create policy center_documents_read_public_metadata on public.center_documents
  for select
  to authenticated
  using (
    status = 'published'
    or uploader_id = (select auth.uid())
    or exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

drop policy if exists center_documents_read_anon_published on public.center_documents;
create policy center_documents_read_anon_published on public.center_documents
  for select
  to anon
  using (status = 'published');

drop policy if exists center_documents_insert_own on public.center_documents;
create policy center_documents_insert_own on public.center_documents
  for insert
  to authenticated
  with check (
    uploader_id = (select auth.uid())
    and copyright_declaration = true
    and status = 'pending_review'
  );

drop policy if exists center_documents_update_own_pending on public.center_documents;
create policy center_documents_update_own_pending on public.center_documents
  for update
  to authenticated
  using (
    uploader_id = (select auth.uid())
    and status in ('pending_review', 'rejected')
  )
  with check (
    uploader_id = (select auth.uid())
    and status in ('pending_review', 'rejected')
  );

drop policy if exists center_documents_update_admin on public.center_documents;
create policy center_documents_update_admin on public.center_documents
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

drop policy if exists center_upload_credits_own on public.center_upload_credits;
create policy center_upload_credits_own on public.center_upload_credits
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists center_unlocks_read_own on public.center_unlocks;
create policy center_unlocks_read_own on public.center_unlocks
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists center_helpful_votes_own on public.center_helpful_votes;
create policy center_helpful_votes_own on public.center_helpful_votes
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists center_reports_insert_own on public.center_reports;
create policy center_reports_insert_own on public.center_reports
  for insert
  to authenticated
  with check (reporter_id = (select auth.uid()));

drop policy if exists center_reports_read_own_or_admin on public.center_reports;
create policy center_reports_read_own_or_admin on public.center_reports
  for select
  to authenticated
  using (
    reporter_id = (select auth.uid())
    or exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );

drop policy if exists center_policy_acceptances_own on public.center_policy_acceptances;
create policy center_policy_acceptances_own on public.center_policy_acceptances
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thuto-center-docs',
  'thuto-center-docs',
  false,
  15728640,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists thuto_center_docs_insert_own on storage.objects;
drop policy if exists thuto_center_docs_select_authorized on storage.objects;
drop policy if exists thuto_center_docs_update_own on storage.objects;
drop policy if exists thuto_center_docs_delete_own on storage.objects;

create policy thuto_center_docs_insert_own on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'thuto-center-docs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy thuto_center_docs_select_authorized on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'thuto-center-docs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1
        from public.feed_admins
        where feed_admins.user_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.center_documents cd
        where cd.storage_path = name
          and cd.status = 'published'
          and public.center_user_can_download((select auth.uid()), cd.id)
      )
    )
  );

create policy thuto_center_docs_update_own on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'thuto-center-docs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'thuto-center-docs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy thuto_center_docs_delete_own on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'thuto-center-docs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1
        from public.feed_admins
        where feed_admins.user_id = (select auth.uid())
      )
    )
  );
