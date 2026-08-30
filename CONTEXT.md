# Thuto — project context

This document summarizes **what Thuto is**, **what it ships today**, **how data and integrations work**, and **where things live in the repo**. Use it for onboarding, AI assistants, and planning.

---

## Product identity

- **Name**: Thuto (short for *Botswana Tertiary Companion* — “BTC” in README).
- **Audience**: Students exploring Botswana undergraduate programmes, admission points, and application logistics.
- **Focus**: Higher-education guidance (predictor, programmes, institutions, funding, community feed) — not secondary-school curriculum hosting.
- **Expansion strategy**: Localise **country by country** across Africa (local exam systems, institution catalogues, admissions rules, copy). Botswana is the live market today; avoid a generic global edtech clone.
- **Form factor**: **Progressive Web App (PWA)** — installable, offline-friendly static build; no required backend for core flows.
- **Stack**: **Vite 5** + **React 18** + **React Router 6** + **Tailwind CSS 3**; optional **Supabase** for community features.

---

## Core features (shipped)

### Marketing / entry

- **Landing page** at `/` (`LandingLayout` + `LandingPage`): hero, features, universities strip, CTA into the app.

### App shell (`Layout`)

- **Bottom navigation** (mobile): Home, Predictor, Feed, Ask, Profile — hidden on Home so partner content fills the screen. Programmes lives in the account drawer (and desktop top nav). Saved programmes remains available outside the bottom nav.
- **Legal / trust**: Disclaimer and Privacy routes.

### Home (`/app`)

- Primary advertising surface for partner universities (hero banner, daily spotlight slideshow, and featured institution cards).
- **Daily spotlight** rotates spotlight-tier partners each day in a swipeable carousel with short descriptions.
- **Best Thuto Centre creators** spotlight for top community uploaders.
- **Application deadline urgency** shown first when university JSON includes close dates within 30 days (see `src/lib/applicationDates.js`).
- No bottom navigation on Home — students reach other tools via the account drawer (mobile) or desktop top nav.

### Admission predictor (`/predictor`)

- **27 grading profiles** across five regions (`GRADING_PROFILES` in `src/lib/gradingSystems.js`, split by region under `src/lib/grading/`) — not BGCSE-only. Botswana's BGCSE remains the curated reference scale: every programme `minPoints` in `public/data/programmes.json` is calibrated to its **48-point best-six** maximum.
- Enter subjects for the chosen syllabus (canonical BGCSE/IGCSE subject list in `src/lib/bgcseSubjects.js`, reused across profiles via each profile's `examBoards`).
- **Aggregate** style varies by profile (`aggregate` field: `bestSix`, `aps`, `aggregatePoints`, `advancedPoints`, …) and the strongest result is not always the highest number — ECZ, WASSCE, MSCE and similar scales are `direction: "lower_better"`. `computeBestSixBreakdown` in `src/lib/admissions.js` sorts and slices per the profile.
- **Cross-syllabus comparison**: results are normalised onto a shared 0–100 **attainment index** (`attainmentIndex` / `requiredIndexFromMinPoints` / `indexToBgcsePoints` in `gradingSystems.js`) so any scale can be compared against a BGCSE-calibrated `minPoints`. Non-BGCSE results always show a "≈ n/48 BGCSE-equivalent" conversion and the `CROSS_SYLLABUS_DISCLAIMER` — treat this as guidance, never an official equivalency.
- **Subject requirements** (`programme.subjectRequirements`, e.g. `{"english": "C"}`) are BGCSE letters, so they are only comparable across scales via a **canonical band ladder** (`CANONICAL_BANDS` in `src/lib/grading/builders.js`). `rowsToRequirementGrades` returns bands, not native grades; `meetsSubjectRequirement` compares band rank, not points. Comparing raw points across scales does not work — a low number is a strong ECZ grade and a failing BGCSE one.
- **Searchable picker** (`src/components/SyllabusPicker.jsx`, `searchSyllabi`/`groupedSyllabi` in `gradingSystems.js`): searches by abbreviation (WASSCE, WAEC, NSC, KCSE, BAC, …). A student's market country only scopes the *default* list shown, never which syllabus they can pick.
- **`verified: false`** profiles (11 of 27) could not be confirmed against an official source; the UI shows a "Guidance scale" chip and `GUIDANCE_SCALE_NOTICE`. See each profile's `sourceNote`.
- `scripts/validate-syllabus-registry.mjs` keeps the JS registry and the Supabase `syllabus_types` seed (`supabase/migrations/20260805130000_syllabus_registry.sql`) in sync.

### Programme catalogue (`/programmes`, `/programmes/:id`)

- **Search, filter, sort** with **URL query persistence** (e.g. `q`, `uni`, `field`, `minPts`, `maxPts`, `sort`, `qualify`).
- **Detail pages**: description, min points, requirements, fees (approximate where noted), modules by semester, careers, official/apply links where present in JSON.

### Universities (`/universities`, `/universities/:id`)

- List and detail from **`public/data/universities.json`**.
- Institution marks use bundled logos under `public/university-logos/` (with initials fallback). Thuto is **not affiliated** with listed institutions; affiliation notes appear near logo surfaces and on `/disclaimer`.
- **Remote override**: optional `VITE_UNIVERSITIES_REMOTE_URL` — fetch JSON at runtime (`cache: 'no-store'`), merge rows **by `id`** into bundled data for fresh application windows and links (see README + `.env.example`).

### Saved programmes (`/saved`)

- **Bookmarks** in **localStorage** (max **10**, LRU trim when over limit — see `src/lib/bookmarks.js`, `useBookmarks`).

### My applications (`/applications`, `/applications/:id`)

- Tracks every programme a student has applied to, across three channels (`src/lib/applications.js`): **hosted** (submitted through Thuto, for institutions with no online portal of their own), **external** (student clicked Apply on the institution's own site — a click is intent, not a submission, until the student confirms), and **manual** (added after the fact).
- Signed out, or with Supabase unconfigured, external/manual tracking works entirely from **localStorage** (`useApplications` mirrors `useBookmarks`); the hosted application form is hidden rather than shown broken, since it needs an account to save to.
- Schema: `supabase/migrations/20260805120000_student_applications.sql` (`student_applications`, `institution_application_settings`, `student_application_events`, a `submit_student_application` RPC, and a private `application-documents` storage bucket).
- CMS side: a top-level **Applications** page (four status tabs: Pending, Awaiting Interview, Accepted, Rejected) plus a **Settings → Applications** tab where a partner turns on hosted applications, sets an application fee, and configures required fields/documents.

### Scroll Feed (`/feed`, `/admin/feed`)

- Signed-in community feed for posts, images, comments, reactions, and reports (categories include opportunities such as **internship** posts from the community).
- Posts/comments are moderated by the Supabase Edge Function `feed-moderation`; safe content can auto-publish, uncertain content goes to admin review, and unsafe content is rejected.
- Admin users are seeded in `feed_admins` and can approve, reject, remove, or restore content in `/admin/feed`.
- Schema lives in `supabase/migrations/20260530120000_scroll_feed.sql`; client helpers live in `src/lib/feed.js`.
- There is **no** dedicated Internships service page; `/internships` redirects to `/feed`.

### Compare (`/compare`)

- Side-by-side comparison of selected programmes; **shareable URL** state via `useCompareSelection` / `src/lib/compareSelection.js`.

### Fit Finder (`/fit-finder`)

- Short **quiz** (work style, subjects enjoyed, career curiosity, study pace, post-grad priorities) stored in localStorage (`FIT_FINDER_ANSWERS_KEY` in `src/lib/fitFinder.js`).
- **Heuristic scoring** maps answers to programme `field` / themes — exploratory guidance, not an official placement test.

### Share admission result (`/share`)

- Optional **anonymous community submissions** to Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
- **Client-side rate limiting** on the share form; UI for community stats on programme pages when configured (`ProgrammeCommunityStats`, `communitySubmissions.js`).
- If Supabase is **not** configured, related UI is hidden or degrades cleanly (`isSupabaseConfigured()` in `src/lib/supabase.js`).

### Static pages

- **`/disclaimer`**, **`/privacy`**: compliance and “guidance only” messaging.
- **`/*`**: `NotFound` for unknown routes inside the app layout.

### PWA & SEO baseline

- **vite-plugin-pwa**: manifest, icons, service worker, `StaleWhileRevalidate` for `/data/*` JSON (`vite.config.js`).
- **Global Open Graph / Twitter** tags and default `<title>` in `index.html`; **per-route titles** via `useDocumentTitle` on pages (deep links still get the **global** OG card unless prerender/server meta is added later — see `thuto_roadmap.md`).
- **Institution CMS**: partner staff now use a **separate frontend** served from **`/cms/`** (same repo, shared Supabase/backend, distinct shell and navigation from the student PWA). Legacy `/partner` links hand off to the CMS. Nav: Home, Profile, **Programmes** (searchable list → dedicated `/programmes/:id` edit page, with create and archive/delete), **Applications** (four status tabs, the primary admissions surface), Data and Analytics (Leads lives here now as a tab, since it's top-of-funnel "contact me" rather than a formal application), Feed (stub), FAQ and Student Reviews, and **Settings** (Branding / Applications / Team and access).

---

## Data model (high level)

### `public/data/programmes.json`

Array of programme objects. Typical fields include:

| Field | Role |
|--------|------|
| `id` | Stable slug for routing |
| `name`, `university`, `field` | Display + filtering |
| `minPoints` | Admission points threshold |
| `subjectRequirements` | e.g. `{ "math": "B", "english": "C", "science": "C" }` |
| `duration`, `description` | Narrative |
| `fees` | `{ domestic, currency, per, note }` |
| `applicationFee`, `applicationFeeCurrency`, `applicationFeeNote` | Rare on the record itself; usually resolved from the institution's `institution_application_settings` instead (`resolveApplicationFee` in `src/lib/universityFees.js`) |
| `modules` | Semester-grouped module strings |
| `careers` | String array |
| `officialUrl`, apply-related fields | Where documented in JSON |
| `archived` | CMS-set override flag; hides the programme from `fetchProgrammes()` unless `includeArchived` is passed (the CMS itself always passes it) |
| `hasBundledRecord` | Not stored — added at merge time (`mergeContentOverrides`) to tell a CMS-created programme (no bundled row, can be hard-deleted) from a bundled one (can only be archived) |

### `public/data/universities.json`

Institution cards (UB, BIUST, BAC-style entries): branding copy, links, and **application window** fields consumed for banners and detail pages.

Optional **`resources[]`** on each university (external links only — Thuto does not host PDFs):

| Field | Role |
|--------|------|
| `title` | Link label shown in the Downloads & resources section |
| `category` | e.g. Application guide, How to apply, Fees, Calendar, Prospectus, Admissions page |
| `url` | Absolute `https://` URL to the institution’s PDF or page |
| `format` | `PDF` or `Web page` |
| `sourceLabel` | Institution name for attribution |

The university detail page always shows **Downloads & resources** after Programmes; when `resources` is empty, students still get **Official website** / **Apply online** fallbacks from the main record.

**Curating resources (55 canonical institutions):**

1. `node scripts/discover-university-resources.mjs` — crawl official sites → `scripts/data/drafts/university-resources-draft.json`
2. `node scripts/build-university-resources-curated.mjs` — baseline curated file from bundled data
3. `node scripts/apply-resources-draft-to-curated.mjs` — merge draft PDFs into curated (optional)
4. Edit `scripts/data/curated/university-resources.json` as needed
5. `node scripts/merge-university-resources.mjs` — write into `public/data/universities.json`
6. `node scripts/validate-university-resources.mjs`

### Scripts / source material (`scripts/`)

- **`build-programmes-catalog.mjs`**, **`merge-ub-admissions-2025.mjs`**, **`merge-admission-overrides.mjs`**, **`merge-ub-modules-from-calendar.mjs`**: pipeline to enrich or reconcile `programmes.json` from text/PDF-derived sources (see `scripts/data/*`, `ADMISSIONS-MINPOINTS.md`).
- **`supabase-rls-policies.sql`**: intended RLS for submissions table (must be applied in Supabase project).

---

## Environment variables

From **`.env.example`** (Vite `VITE_*` prefix):

| Variable | Purpose |
|----------|---------|
| `VITE_UNIVERSITIES_REMOTE_URL` | HTTPS JSON URL merged into bundled universities by `id` |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser-safe anon key for inserts / verified reads only |

---

## Important libraries (`src/lib/`)

| Module | Responsibility |
|--------|----------------|
| `admissions.js` | Aggregate scoring, requirement evaluation vs programmes, syllabus-aware throughout |
| `gradingSystems.js` (+ `grading/*`) | 27-profile registry, canonical band ladder, cross-syllabus normalisation, search |
| `bgcseSubjects.js` | Canonical subject ids/labels for predictor UI, shared across syllabi via `examBoards` |
| `applications.js` | Student application tracking (hosted/external/manual channels) + CMS-side reads/writes |
| `universitiesData.js` | Load + merge bundled + remote university JSON |
| `applicationDates.js` | Deadline copy and urgency for UI |
| `bookmarks.js` / `compareSelection.js` | localStorage persistence + limits |
| `fitFinder.js` | Quiz copy, defaults, scoring helpers |
| `communitySubmissions.js` | Supabase insert + rate limit helpers |
| `supabase.js` | Lazy client, `isSupabaseConfigured()` |

---

## Routes (quick reference)

| Path | Page / purpose |
|------|----------------|
| `/` | Landing |
| `/app` | Home |
| `/feed` | Moderated community scroll feed |
| `/admin/feed` | Feed moderation panel for seeded admins |
| `/fit-finder` | Fit Finder quiz + results |
| `/predictor` | Admission predictor (27 African exam systems) |
| `/programmes` | Catalogue |
| `/programmes/:id` | Programme detail |
| `/universities` | University list |
| `/universities/:id` | University detail |
| `/saved` | Bookmarked programmes |
| `/applications` | My applications tracker |
| `/applications/:id` | Application detail / hosted application form |
| `/compare` | Compare selection |
| `/share` | Share admission result (Supabase optional) |
| `/sponsorships` | Funding routes + private sponsorship posts |
| `/internships` | Redirect → `/feed` (internship posts live in the feed) |
| `/study`, `/study/:subjectId` | Redirect → `/predictor` (BGCSE Study / Learning Passport removed) |
| `/disclaimer`, `/privacy` | Legal |
| `*` | Not found |

---

## Product pillars (design docs)

Longer intent/spec notes live beside the code:

- `pillar1_smart_predictor.md` — predictor behaviour and subject list
- `pillar2_community_data.md` — community / Supabase submissions
- `pillar3_programme_profiles.md` — programme profile content depth

**Operational roadmap** (launch checklist, remaining work): `thuto_roadmap.md`.

**AI-native CMS strategy** (AI-native vs AI-powered; Partner → Admin → student grounding): [`docs/AI_NATIVE_CMS_STRATEGY.md`](./docs/AI_NATIVE_CMS_STRATEGY.md).

---

## Commands

```bash
npm install
npm run dev          # Vite dev server (default ~ http://localhost:5173)
npm run build        # Production bundle + PWA assets
npm run preview      # Serve dist (test SW / offline)
npm run merge-ub-admissions
npm run merge-admission-overrides
```

---

## Disclaimer for builders and models

Thuto uses **curated JSON** and documented merge scripts; min points and deadlines should be **verified against official university sources** before being treated as authoritative. The app presents itself as **guidance**, not a guarantee of admission (see Disclaimer page).
