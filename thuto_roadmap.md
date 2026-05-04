# Thuto - Updated Roadmap (reflects actual codebase)

> Last updated to match shipped code. Items marked ✅ are done.
> Only real remaining work is listed below the fold.

---

## What is already shipped ✅

- ✅ Expanded BGCSE predictor (7–9 subjects, best-6 auto-selection, breakdown card)
- ✅ Programmes search, filter, sort with URL persistence (q, uni, field, minPts, maxPts, sort, qualify)
- ✅ Programme detail pages `/programmes/:id` (modules, careers, fees, deadlines)
- ✅ Application deadlines + homepage urgency banner
- ✅ Bookmarks (max 10, LRU trim, localStorage, `/saved`)
- ✅ Compare tool (`/compare`, side-by-side, shareable URL)
- ✅ PWA manifest + service worker (vite-plugin-pwa)
- ✅ Supabase community submissions (optional, degrades cleanly when unconfigured)
- ✅ Client-side rate limiting on share form
- ✅ Remote university JSON merge (by id, .env.example documented)

---

## Remaining work - launch blockers

### 1. Open Graph + per-route social previews
**Why it matters**: WhatsApp and Facebook show a blank link when students share a programme.
That kills organic sharing - your main growth channel.

**Shipped in repo (verify after deploy)**: Global OG/Twitter tags in `index.html`, `public/og-image.png` (1200×630), per-route `document.title` via `useDocumentTitle` on all pages. Crawlers still use the **global** card for deep links (SPA); per-programme OG needs prerender or a server if you want that later.

**What to do**:
- Add global OG tags to `index.html` as a baseline:
```html
<meta property="og:title" content="Thuto - Your Botswana University Companion" />
<meta property="og:description" content="Check BGCSE eligibility, explore programmes at UB, BIUST, BAC and more." />
<meta property="og:image" content="https://thuto.bw/og-image.png" />
<meta property="og:url" content="https://thuto.bw" />
<meta name="twitter:card" content="summary_large_image" />
```
- Create a single `og-image.png` (1200×630px) - Thuto logo + tagline on teal background
- For programme detail pages: either use a build-time prerender plugin (`vite-plugin-ssr` or `@vitejs/plugin-legacy`) OR accept that deep links show the global OG (fine for MVP)
- Add `<title>` per route using a `useEffect` + `document.title` in each page component

**Files to touch**: `index.html`, each page component, `public/og-image.png`

---

### 2. Supabase RLS - verify server-side policies
**Why it matters**: Client code shows the right intent but RLS lives on the server.
If policies aren't set, anyone can read all raw unverified submissions.

**Verify this SQL is applied in your Supabase dashboard → SQL editor**:
```sql
-- Confirm RLS is enabled
alter table submissions enable row level security;

-- Insert: anyone can submit (anon key)
create policy "anon_insert" on submissions
  for insert with check (true);

-- Select: only verified, unflagged rows are readable
create policy "read_verified" on submissions
  for select using (verified = true and flagged = false);

-- Update/Delete: only service role (your admin account) can touch rows
-- (no policy needed - RLS blocks it by default for anon key)
```

**Also confirm**:
- [ ] Anon key in `.env` does NOT have service role privileges
- [ ] `verified` defaults to `false` on insert (so new submissions are hidden until reviewed)
- [ ] You have a review workflow - even if it's just "check Supabase table editor weekly"

---

### 3. Data expansion - more institutions
**Priority order**:

| Institution | Status | Action needed |
|---|---|---|
| Botho University | Missing | Research programmes + add to programmes.json |
| BA ISAGO University | Missing | Research programmes + add to programmes.json |
| ABM University College | Missing | Focus on health & education programmes |
| Limkokwing | Optional | Creative/tech - lower priority |

**For each new programme, fill**:
- name, university, minPoints, subjectRequirements
- description (2–3 sentences)
- modules (year 1 minimum)
- careers (4–6 options)
- fees (mark approximate)
- applicationDeadline, applyUrl, officialUrl
- field (Technology / Business / Engineering / Health Sciences / etc.)

**Verify existing data**:
- [ ] Confirm all 8 current min points against official UB/BIUST/BAC sources for 2026 intake
- [ ] Update applicationDeadline fields for 2026 intake
- [ ] Check all applyUrl links are live

---

## Remaining work - quality / post-launch

### 4. ESLint + basic tests
**Highest ROI for long-term maintenance**:

```bash
npm install -D eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks
```

Add to `package.json`:
```json
"scripts": {
  "lint": "eslint src",
  "test": "vitest"
}
```

**Minimum tests to write** (add `src/utils/admissions.test.js`):
```js
import { computeBestSixBreakdown } from './admissions'

test('picks best 6 from 8 subjects', () => {
  const input = [
    { subject: 'Maths', grade: 'A' },      // 6
    { subject: 'English', grade: 'B' },    // 5
    { subject: 'Science', grade: 'A' },    // 6
    { subject: 'Setswana', grade: 'C' },   // 4
    { subject: 'History', grade: 'D' },    // 3
    { subject: 'Business', grade: 'B' },   // 5
    { subject: 'Art', grade: 'E' },        // 2  ← dropped
    { subject: 'PE', grade: 'D' },         // 3  ← dropped
  ]
  const result = computeBestSixBreakdown(input)
  expect(result.total).toBe(29) // 6+6+5+5+4+3
  expect(result.bestSix).toHaveLength(6)
  expect(result.dropped).toHaveLength(2)
})

test('correctly flags missing subject requirement', () => {
  // test your requirement checking logic
})
```

### 5. Analytics
Add Plausible (privacy-friendly, no cookie banner needed) or GA4:

```html
<!-- Plausible - add to index.html -->
<script defer data-domain="thuto.bw"
  src="https://plausible.io/js/script.js"></script>
```

Key events to track:
- Predictor used (how many subjects entered, total points)
- Programme detail page views (which programmes are most viewed)
- Compare tool used
- Share result form submitted
- Apply link clicked

### 6. .gitignore cleanup
Ensure these are in `.gitignore` and not committed (present in repo: `node_modules/`, `dist/`, `.env`, `.env.local`, `.cursor/`):
```
node_modules/
dist/
.env
.env.local
.cursor/
```

### 7. Accessibility audit
- Run `axe` browser extension on each page
- Confirm all form inputs have `<label>` elements
- Confirm all interactive elements are keyboard navigable
- Test on Android Chrome (your primary user device)

---

## Launch checklist

- [x] OG image created and uploaded to `/public/og-image.png`
- [x] OG meta tags added to `index.html`
- [x] `<title>` set per route
- [ ] Supabase RLS verified in dashboard
- [ ] All 8 current programme min points verified for 2026
- [ ] Application deadlines updated for 2026 intake
- [ ] Botho University programmes added
- [ ] BA ISAGO programmes added
- [ ] Domain live with HTTPS
- [ ] Build passes: `npm run build`
- [ ] PWA installable on Android (test via Chrome → Add to Home Screen)
- [ ] Test on mobile (Android Chrome + iOS Safari)
- [ ] Disclaimer visible: "For guidance only - verify with universities"
- [ ] Share result form tested end-to-end with Supabase

---

## Suggested remaining order

```
Day 1:  OG tags + og-image.png + per-route titles  (1–2 hours)
Day 2:  Supabase RLS verification + test submission end-to-end
Day 3:  Botho University data entry
Day 4:  BA ISAGO data entry + verify existing programme data
Day 5:  ESLint setup + 2–3 core tests
Day 6:  Analytics setup + .gitignore cleanup
Day 7:  Full mobile test + accessibility spot check → launch
```
