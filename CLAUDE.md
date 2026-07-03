# CLAUDE.md — Thuto agent guide

Instructions for Claude, Cursor, and other coding agents working in this repo.

**Read first:** [CONTEXT.md](./CONTEXT.md) (product + architecture), [DESIGN.md](./DESIGN.md) (visual tokens), [README.md](./README.md) (run/build/deploy).

---

## Goal

Ship **small, focused changes**. Pages and routing have broken repeatedly when agents refactor bootstrap code, rename routes, or rewrite shared layout/navigation. **Do not “clean up” init or routing unless the task explicitly asks for it.**

---

## Do not modify without an explicit task

These files control app bootstrap, deployment paths, and global navigation. Touching them causes cross-page regressions.

| File | Why it is fragile |
|------|-------------------|
| `src/main.jsx` | React root, `BrowserRouter` **basename**, PWA service-worker auto-update |
| `src/App.jsx` | Canonical route table (lazy imports + `Routes`) |
| `vite.config.js` | `base` path (`/thuto/` on GitHub Pages), PWA manifest, Workbox SPA fallback |
| `index.html` | Global SEO/OG tags, `%BASE_URL%` placeholders |
| `src/components/Layout.jsx` | App shell, scroll chrome, desktop nav, bottom nav visibility |
| `src/components/BottomNav.jsx` | Mobile primary nav (Home, Predictor, Feed, Ask, Profile) |
| `src/components/landing/LandingLayout.jsx` | Marketing shell for `/` only |
| `src/hooks/useScrollChrome.js` | Header/bottom-nav hide-on-scroll-down, show-on-scroll-up |
| `scripts/copy-spa-404.mjs` | GitHub Pages SPA routing (404 → index.html) |

### Bootstrap rules (`src/main.jsx`)

- Keep `routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "")` — required for GitHub Pages subpath `/thuto/`.
- Keep PWA `registerSW({ immediate: true, onNeedRefresh: () => updateSW(true) })` — prevents stale cached chrome after deploys.
- Do **not** add providers, routers, or global side effects here unless the task requires it. Prefer page-level or `Layout`-level changes.

### Routing rules (`src/App.jsx`)

- **`/`** = landing (`LandingLayout`). **`/app`** = signed-in home (`Layout`). Do not swap these.
- New routes go **inside** the correct layout:
  - Marketing-only → under `<Route element={<LandingLayout />}>`
  - App pages → under `<Route element={<Layout />}>`
- Register new pages with `lazy(() => import(...))` and add a matching `<Route path="..." element={...} />`.
- Redirects like `/login` → `/auth?mode=login` are intentional; do not remove.
- Catch-all `path="*"` must stay last inside `Layout`.

---

## Route reference (canonical)

| Path | Page | Layout |
|------|------|--------|
| `/` | Landing | LandingLayout |
| `/app` | Home | Layout |
| `/predictor` | BGCSE predictor | Layout |
| `/programmes`, `/programmes/:id` | Catalogue + detail | Layout |
| `/universities`, `/universities/:id` | Institutions | Layout |
| `/feed/*` | Community feed | Layout + FeedLayout |
| `/assistant` | Ask Thuto (AI + local) | Layout |
| `/profile`, `/settings`, `/auth`, `/onboarding` | Account | Layout |
| `/disclaimer`, `/privacy` | Legal | Layout |

Full list lives in `src/App.jsx` and [CONTEXT.md](./CONTEXT.md#routes-quick-reference).

---

## How to add or change a page safely

1. **Create** `src/pages/YourPage.jsx` (or `.tsx`). Match existing page patterns: `useDocumentTitle`, Tailwind + CSS vars from `DESIGN.md`.
2. **Register** lazy import + route in `src/App.jsx` only — do not restructure other routes.
3. **Navigation:** add links only where appropriate:
   - Mobile primary tabs → `BottomNav.jsx` (avoid — tabs are fixed by product)
   - Desktop top nav → `Layout.jsx` `desktopLinks`
   - Drawer / footer → `AccountDrawer.jsx`, `LandingFooter.jsx`, etc.
4. **CMS copy** (optional): add defaults to `src/lib/pageContentDefaults.js` and use `usePageContent(pageKey, defaults)` like other marketing pages.
5. **Verify:** `npm run build` and spot-check the route in dev (`npm run dev`).

---

## Layout and scroll chrome

- `Layout` hides the **bottom nav on Home** (`/app`) so partner content fills the screen.
- `useScrollChrome` hides header + bottom nav on scroll **down**, reveals on scroll **up** or near top (`TOP_REVEAL_OFFSET = 48`).
- Feed routes use `feedChrome.jsx` helpers for compact header and message-thread exceptions.
- **Do not** remove `sm:translate-y-0` on the header — desktop header must stay visible while mobile hides on scroll.
- Recent fixes (commits on `main`) restored this behavior after agents broke it; preserve the pattern.

---

## Styling and components

- Use Tailwind with tokens from `tailwind.config.js` and CSS variables (`--thuto-surface`, `--thuto-surface-elevated`, brand palette).
- Typography: **Literata** (display/headlines), **Figtree** (UI/body) — see `DESIGN.md`.
- Reuse existing components (`BrandMark`, `SectionTitle`, cards, pills) before adding new abstractions.
- Programme/university visuals: `src/lib/programmeBranding.js`, `src/lib/universityBranding.js`.

---

## Data and business logic

- Programmes: `public/data/programmes.json` — edit or use merge scripts under `scripts/`.
- Universities: `public/data/universities.json` — optional remote merge via `VITE_UNIVERSITIES_REMOTE_URL`.
- Admission math: `src/lib/admissions.js` (BGCSE points, best-six, requirement checks).
- Supabase is **optional** for core flows; check `src/lib/supabase.js` / `isSupabaseConfigured()` before assuming cloud features.

---

## Deploy and paths

- **GitHub Pages** default base: `/thuto/` (`vite.config.js`, `.github/workflows/deploy.yml`).
- Custom domain (`thuto.bw`): set `VITE_BASE_PATH=/` and `VITE_SITE_URL`.
- Internal links use React Router `<Link to="/predictor">` — **never** hard-code `/thuto/` in components; basename handles it.
- After route changes, confirm SPA 404 copy script still runs (`npm run postbuild`).

---

## Commands

```bash
npm install
npm run dev          # local dev (~ http://localhost:5173)
npm run build        # production + PWA + SEO assets
npm run preview      # serve dist/
```

Run `npm run build` before finishing any change that touches routing, layout, or Vite config.

---

## Agent checklist before opening a PR

- [ ] Scope limited to the requested feature/fix — no drive-by init or route refactors
- [ ] `src/main.jsx`, `vite.config.js`, and `Layout.jsx` unchanged unless task required them
- [ ] New routes registered in `App.jsx` under the correct layout
- [ ] `npm run build` succeeds
- [ ] Mobile and desktop navigation still work on `/app`, `/feed`, `/assistant`
- [ ] Scroll up still reveals header/logo on pages that use scroll chrome

---

## Disclaimer

Thuto is **guidance**, not official admission advice. Min points and deadlines in JSON must be verified against university sources.
