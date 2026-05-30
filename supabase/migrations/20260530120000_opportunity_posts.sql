-- Manual opportunity posts: private sponsorship (e.g. BDF) and internships.
-- Public app reads published, non-expired rows via anon key.
-- Create/update/delete via Supabase Dashboard (service role) or SQL editor.

create table if not exists opportunity_posts (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('private_sponsorship', 'internship')),
  sponsor text not null default '',
  title text not null,
  body text not null,
  image_url text,
  source_url text,
  published boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunity_posts_category_published_idx
  on opportunity_posts (category, published, published_at desc nulls last);

alter table opportunity_posts enable row level security;

drop policy if exists read_published_opportunities on opportunity_posts;

create policy read_published_opportunities on opportunity_posts
  for select using (
    published = true
    and (expires_at is null or expires_at > now())
  );

-- Public bucket for flyer / screenshot images (upload via Dashboard → Storage).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'opportunity-images',
  'opportunity-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists opportunity_images_public_read on storage.objects;

create policy opportunity_images_public_read on storage.objects
  for select using (bucket_id = 'opportunity-images');
