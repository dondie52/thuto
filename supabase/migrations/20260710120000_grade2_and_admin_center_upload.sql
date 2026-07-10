-- grade2 for Science Double Award component grades; admin official Center uploads.

alter table public.user_grade_entries
  add column if not exists grade2 text;

-- Thuto Center: distinguish peer uploads from admin-curated official materials.
alter table public.center_documents
  add column if not exists source text not null default 'peer'
    check (source in ('peer', 'official'));

create index if not exists center_documents_source_idx
  on public.center_documents (source, status, published_at desc nulls last);

-- Skip credit rewards for official/admin-curated uploads.
create or replace function public.center_award_upload_credits()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'published'
    and old.status is distinct from 'published'
    and coalesce(new.source, 'peer') = 'peer' then
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

-- Official curated documents are free to download for all signed-in users.
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
        d.source = 'official'
        or d.uploader_id = p_user_id
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

drop policy if exists center_documents_insert_admin on public.center_documents;
create policy center_documents_insert_admin on public.center_documents
  for insert
  to authenticated
  with check (
    uploader_id = (select auth.uid())
    and copyright_declaration = true
    and status = 'published'
    and source = 'official'
    and exists (
      select 1
      from public.feed_admins
      where feed_admins.user_id = (select auth.uid())
    )
  );
