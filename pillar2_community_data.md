# Pillar 2 - Community Admission Data

## Overview
Let students who have already applied share their results. Over time this builds a real dataset of what scores actually get accepted at each programme - making the predictor smarter and building trust with new applicants.

---

## Supabase Setup

### 1. Create project at supabase.com
- Project name: `thuto`
- Region: closest to Botswana (choose Africa/Middle East)
- Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`

### 2. Install client
```bash
npm install @supabase/supabase-js
```

### 3. Create client
```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## Database Schema

Run this SQL in the Supabase SQL editor:

```sql
create table submissions (
  id uuid default gen_random_uuid() primary key,
  programme_id text not null,
  programme_name text not null,
  university text not null,
  points integer not null check (points >= 0 and points <= 54),
  outcome text not null check (outcome in ('accepted', 'rejected', 'waitlisted')),
  year integer not null check (year >= 2018 and year <= 2030),
  verified boolean default false,
  flagged boolean default false,
  created_at timestamp with time zone default now()
);

-- Allow anyone to insert (anonymous submissions)
alter table submissions enable row level security;

create policy "Anyone can submit"
  on submissions for insert
  with check (true);

-- Only allow reading verified submissions
create policy "Read verified only"
  on submissions for select
  using (verified = true and flagged = false);
```

---

## Component: `ShareResult.jsx`

A modal or inline form shown after a student uses the predictor OR on a standalone `/share` route.

### Fields
```
1. Programme applied for     → searchable dropdown (from programmes.json)
2. University                → auto-filled from programme selection
3. Your points total         → number input (0–54)
4. Outcome                   → button group: Accepted / Waitlisted / Rejected
5. Year of application       → dropdown: 2018–current year
```

### Submission function
```js
async function submitResult(formData) {
  const { error } = await supabase
    .from('submissions')
    .insert([{
      programme_id: formData.programmeId,
      programme_name: formData.programmeName,
      university: formData.university,
      points: formData.points,
      outcome: formData.outcome,
      year: formData.year,
    }])

  if (error) throw error
  return true
}
```

### UX
- Show the form after predictor results with message:
  "Already applied? Share your result and help future students."
- After submission: "Thank you - your result will appear after a quick review."
- No login required
- Rate limit: store submission timestamp in localStorage to prevent spam
  (max 3 submissions per device per day)

---

## Component: `AdmissionStats.jsx`

Shown on each programme detail page. Displays community data for that programme.

### Data fetch
```js
async function getStats(programmeId) {
  const { data } = await supabase
    .from('submissions')
    .select('points, outcome, year')
    .eq('programme_id', programmeId)
    .order('year', { ascending: false })

  return data
}
```

### Display (when data exists)
```
┌─────────────────────────────────────────┐
│ Based on 47 student reports             │
│                                         │
│ Accepted   avg 33 pts  ████████░░  68%  │
│ Waitlisted avg 30 pts  ███░░░░░░░  15%  │
│ Rejected   avg 27 pts  ██░░░░░░░░  17%  │
│                                         │
│ Most recent: 2024 intake                │
└─────────────────────────────────────────┘
```

### Display (when insufficient data - fewer than 5 submissions)
```
┌─────────────────────────────────────────┐
│ No community data yet for this          │
│ programme.                              │
│                                         │
│ [Share your result →]                   │
└─────────────────────────────────────────┘
```

---

## Admin: Moderation

Use the Supabase table editor to review and approve submissions:

1. Go to Table Editor → submissions
2. Filter `verified = false`
3. Review each row - approve by setting `verified = true`
4. Flag suspicious entries with `flagged = true`

### Auto-flag rule (add to Supabase Edge Function later)
Flag submissions where `points` is more than 8 below `min_points` for that programme and outcome is 'accepted' - these are likely errors or fake data.

---

## Reach/Safe/Likely Upgrade

Once you have enough community data (50+ submissions per programme), upgrade the predictor matching to use real distributions instead of fixed thresholds:

```js
async function getRealisticStatus(programmeId, studentPoints) {
  const stats = await getStats(programmeId)
  const accepted = stats.filter(s => s.outcome === 'accepted')
  
  if (accepted.length < 10) return null // fall back to rule-based
  
  const avg = accepted.reduce((s, r) => s + r.points, 0) / accepted.length
  const min = Math.min(...accepted.map(r => r.points))
  
  if (studentPoints >= avg) return 'safe'
  if (studentPoints >= min) return 'target'
  if (studentPoints >= min - 2) return 'reach'
  return 'unlikely'
}
```

---

## File Structure
```
src/
  pages/
    Share.jsx              ← standalone share result page (/share)
  components/
    ShareResult.jsx        ← submission form (inline or modal)
    AdmissionStats.jsx     ← stats display on programme detail page
  lib/
    supabase.js            ← supabase client
  hooks/
    useSubmissions.js      ← fetch + cache submissions data
.env
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
```

---

## Launch Strategy (Cold Start Fix)

Before launch, seed data manually:
1. Post in Botswana student Facebook groups:
   "Thuto is building a free database of real UB/BIUST/BAC admission results.
   Share yours anonymously at thuto.bw/share - takes 30 seconds."
2. Target Form 5 leavers groups, university Facebook pages, and UB/BIUST student forums
3. Goal: 50+ submissions before public launch so stats show on day one
