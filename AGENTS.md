# Thuto — agent instructions

Botswana University Companion (Thuto / BUC): a **Vite + React 18 PWA** for BGCSE admission guidance, programme exploration, and application logistics. Data is **local JSON first** (`public/data/`); Supabase is optional for auth, community submissions, opportunity posts, and Gemini assistant.

## Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production + PWA + SEO scripts
npm run preview      # serve dist (test service worker)
npm run validate-data
```

See `package.json` for merge scripts (`merge-ub-admissions`, `merge-admission-overrides`, etc.).

## Key docs

| File | Use for |
|------|---------|
| `CONTEXT.md` | Features, routes, data model, env vars |
| `DESIGN.md` | Colours, typography, components, navigation patterns |
| `CLAUDE.md` | Side-drawer tool order and **emoji icon** conventions |
| `README.md` | Setup, Gemini assistant, remote university JSON |
| `thuto_roadmap.md` | Launch checklist and backlog |

## Architecture (short)

- **Routes:** `src/App.jsx` — landing at `/`, app shell at `Layout` with bottom nav + `AccountDrawer`.
- **Admission logic:** `src/lib/admissions.js` (BGCSE points, best-six, `evaluateProgramme`).
- **Data loaders:** `programmesData.js`, `universitiesData.js` (optional `VITE_UNIVERSITIES_REMOTE_URL` merge by `id`).
- **Persistence:** `bookmarks.js`, `compareSelection.js`, `fitFinder.js` — localStorage on device; Pro may sync via Supabase when configured.
- **Auth / billing:** `src/lib/auth.jsx`, `billing.js`, `premium.js`; Stripe via Supabase edge functions when set up.

## Coding conventions

- Match existing patterns in the file you edit (JSX, Tailwind, naming). **Minimize diff scope.**
- Product UI: warm paper surfaces (`#f3f1ec`, `#faf9f6`), teal (`brand-*`) for primary actions and active nav. See `DESIGN.md`.
- **Literata** for display headlines only; **Figtree** for app UI.
- Do not invent admission data — extend `public/data/*.json` or merge scripts; treat min points and deadlines as guidance only.
- Useful tests only when behaviour is non-trivial; avoid trivial assertions.
- Cloud agent branches: `cursor/<descriptive-name>-3aab`, base `main`, push with `git push -u origin <branch>`.

## Mobile navigation

- **Bottom nav (max 5):** Home, Predictor, Programmes, Saved, Ask — see `BottomNav.jsx`.
- **Account drawer:** secondary tools, Thuto Pro upgrade card, “More tools” section — see `AccountDrawer.jsx` and **`CLAUDE.md`** for order and emojis.

## Environment

Copy `.env.example` → `.env`. `VITE_*` vars are public in the client bundle. Never commit secrets.

## Disclaimer

Thuto is indicative guidance. Official university sources remain authoritative.
