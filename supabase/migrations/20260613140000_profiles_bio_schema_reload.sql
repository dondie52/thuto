-- Repair stale PostgREST schema cache for profiles.bio (profile save errors).

alter table public.profiles
  add column if not exists username text,
  add column if not exists bio text,
  add column if not exists syllabus_type text,
  add column if not exists sponsorship_intent text,
  add column if not exists fields_of_interest text[] not null default '{}',
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_skipped_at timestamptz;

notify pgrst, 'reload schema';
