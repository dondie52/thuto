# Thuto — project context

This document summarizes **what Thuto is**, **what it ships today**, **how data and integrations work**, and **where things live in the repo**. Use it for onboarding, AI assistants, and planning.

---

## Product identity

- **Name**: Thuto (short for *Botswana University Companion* — “BUC” in README).
- **Audience**: Students exploring Botswana undergraduate programmes, admission points, and application logistics.
- **Form factor**: **Progressive Web App (PWA)** — installable, offline-friendly static build; no required backend for core flows.
- **Stack**: **Vite 5** + **React 18** + **React Router 6** + **Tailwind CSS 3**; optional **Supabase** for community features.

---

## Core features (shipped)

### Marketing / entry

- **Landing page** at `/` (`LandingLayout` + `LandingPage`): hero, features, universities strip, CTA into the app.

### App shell (`Layout`)

- **Bottom navigation** (mobile): App, Predictor, Programmes, Compare, Saved, Universities.
- **Legal / trust**: Disclaimer and Privacy routes.

### Home (`/app`)

- Hub into predictor, programmes, universities, fit finder, etc.
- **Application deadline urgency** when university JSON includes open/close dates (see `src/lib/applicationDates.js`).

### BGCSE admission predictor (`/predictor`)

- Enter **multiple BGCSE subjects** (canonical list in `src/lib/bgcseSubjects.js`).
- **Best-six** total: highest six subject point scores count; breakdown of counted vs dropped subjects (`computeBestSixBreakdown` in `src/lib/admissions.js`).
- **Grade → points**: A=6 … U=0 (`GRADE_POINTS` in `admissions.js`).
- **Programme matching**: compares totals and **subject requirement keys** (`math`, `english`, `science`, etc.) against each programme in `public/data/programmes.json` via `evaluateProgramme` and related helpers.

### Programme catalogue (`/programmes`, `/programmes/:id`)

- **Search, filter, sort** with **URL query persistence** (e.g. `q`, `uni`, `field`, `minPts`, `maxPts`, `sort`, `qualify`).
- **Detail pages**: description, min points, requirements, fees (approximate where noted), modules by semester, careers, official/apply links where present in JSON.

### Universities (`/universities`, `/universities/:id`)

- List and detail from **`public/data/universities.json`**.
- **Remote override**: optional `VITE_UNIVERSITIES_REMOTE_URL` — fetch JSON at runtime (`cache: 'no-store'`), merge rows **by `id`** into bundled data for fresh application windows and links (see README + `.env.example`).

### Saved programmes (`/saved`)

- **Bookmarks** in **localStorage** (max **10**, LRU trim when over limit — see `src/lib/bookmarks.js`, `useBookmarks`).

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
| `modules` | Semester-grouped module strings |
| `careers` | String array |
| `officialUrl`, apply-related fields | Where documented in JSON |

### `public/data/universities.json`

Institution cards (UB, BIUST, BAC-style entries): branding copy, links, and **application window** fields consumed for banners and detail pages.

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
| `admissions.js` | Points, best-six, requirement evaluation vs programmes |
| `bgcseSubjects.js` | Canonical subject ids/labels for predictor UI |
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
| `/fit-finder` | Fit Finder quiz + results |
| `/predictor` | BGCSE predictor |
| `/programmes` | Catalogue |
| `/programmes/:id` | Programme detail |
| `/universities` | University list |
| `/universities/:id` | University detail |
| `/saved` | Bookmarked programmes |
| `/compare` | Compare selection |
| `/share` | Share admission result (Supabase optional) |
| `/disclaimer`, `/privacy` | Legal |
| `*` | Not found |

---

## Product pillars (design docs)

Longer intent/spec notes live beside the code:

- `pillar1_smart_predictor.md` — predictor behaviour and subject list
- `pillar2_community_data.md` — community / Supabase submissions
- `pillar3_programme_profiles.md` — programme profile content depth

**Operational roadmap** (launch checklist, remaining work): `thuto_roadmap.md`.

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
