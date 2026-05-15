-- Thuto community submissions: table + RLS policies
-- Client: anon key inserts; public reads only verified, unflagged rows (see src/lib/communitySubmissions.js).

create extension if not exists pgcrypto;

create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  programme_id text not null,
  programme_name text not null,
  university text not null,
  points integer not null check (points >= 0 and points <= 48),
  outcome text not null check (outcome in ('accepted', 'rejected', 'waitlisted')),
  year integer not null check (year >= 2018 and year <= 2030),
  verified boolean not null default false,
  flagged boolean not null default false,
  created_at timestamp with time zone default now()
);

alter table submissions enable row level security;

-- Replace legacy policy names from older docs if present.
drop policy if exists "Anyone can submit" on submissions;
drop policy if exists "Read verified only" on submissions;
drop policy if exists anon_insert on submissions;
drop policy if exists read_verified on submissions;

create policy anon_insert on submissions for insert with check (true);

create policy read_verified on submissions
  for select using (verified = true and flagged = false);
