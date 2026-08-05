-- Lets institution staff hard-delete a programme override they created themselves.
--
-- content_programme_overrides already has institution-scoped INSERT and UPDATE policies
-- (20260625150000_revenue_model_and_partners.sql:240-264) but no institution-scoped DELETE — only
-- the superuser policy could delete a row. A programme with no bundled JSON row has nothing to
-- fall back to once its override is edited to nothing, so the CMS needs a real delete path for
-- programmes it created itself. Bundled programmes are archived via a patch instead, never
-- deleted, since deleting their override would just reset them to the bundled defaults.

drop policy if exists content_programme_overrides_institution_delete on public.content_programme_overrides;
create policy content_programme_overrides_institution_delete on public.content_programme_overrides
  for delete
  using (
    exists (select 1 from public.feed_admins where feed_admins.user_id = auth.uid())
    or (
      institution_id is not null
      and public.is_institution_user(institution_id)
    )
  );

notify pgrst, 'reload schema';
