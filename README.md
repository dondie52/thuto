# Thuto (BUC)

Progressive Web App MVP: Botswana University Companion - admission predictor (sample rules), programmes, and universities using local JSON (no backend).

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (20+ recommended to silence optional engine warnings from tooling)

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

`preview` serves the `dist` folder so you can verify the PWA service worker and offline behaviour over HTTPS/localhost.

## Install as PWA

Use Chrome or Edge on desktop or Android: open the app, then use **Install** / **Add to Home screen** when the browser offers it (manifest + service worker are included).

## Project layout

- `src/pages` - Home, Predictor, Programmes, Programme detail, Universities
- `src/lib/admissions.js` - grade points, best-six total, qualification status
- `public/data/programmes.json` - sample programmes (edit to extend)
- `public/data/universities.json` - UB, BIUST, BAC

## Live university application dates

Botswana universities do not expose a single public API for deadlines. Thuto can still load **fresh dates at runtime** from a JSON URL you control:

1. Copy [`.env.example`](.env.example) to `.env` and set `VITE_UNIVERSITIES_REMOTE_URL` to an HTTPS URL that returns either a JSON **array** of university objects or `{ "universities": [...] }`.
2. Each object should include at least `id` (matching `public/data/universities.json`) plus any fields to override, commonly `applicationOpen`, `applicationClose`, `applyUrl`.
3. The response must allow browser access (**CORS**: `Access-Control-Allow-Origin` for your app origin, or `*` for simple public JSON).
4. Rebuild (`npm run build`) so Vite embeds the URL. The client fetches with `cache: 'no-store'` and merges remote rows into the bundled list by `id`.

Without this variable, the app uses only the bundled file (offline-friendly, but dates are static until you redeploy or use the remote feed).

## Deploy to GitHub Pages

The repo ships with a workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) that builds and publishes to GitHub Pages on every push to `main`.

One-time setup on GitHub:

1. **Settings -> Pages -> Build and deployment -> Source:** select **GitHub Actions**.
2. (Optional) **Settings -> Secrets and variables -> Actions** -> add any of these so the build can read them at deploy time:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_UNIVERSITIES_REMOTE_URL`
3. Push to `main` (or run the workflow manually from the **Actions** tab). The site goes live at <https://dondie52.github.io/thuto/>.

How it is wired:

- `vite.config.js` sets `base: '/thuto/'` (override with `VITE_BASE_PATH=/` if you later move to a custom domain).
- `<BrowserRouter basename={import.meta.env.BASE_URL}>` keeps client-side routes correct under the subpath.
- All `fetch('/data/...')` calls use `import.meta.env.BASE_URL` so they resolve to `/thuto/data/...` in production.
- A `postbuild` step copies `dist/index.html` to `dist/404.html` so deep-link refreshes (e.g. `/thuto/programmes`) still load the SPA shell.
- `public/.nojekyll` ensures GitHub Pages serves files starting with `_` untouched.

### Switching to a custom domain (e.g. `thuto.bw`)

1. Add a `public/CNAME` file containing `thuto.bw` (it gets copied to `dist/CNAME` automatically).
2. Set `VITE_BASE_PATH=/` in the workflow's build step (or as a repo secret/variable) so assets resolve from the domain root.
3. Configure DNS as per [GitHub's docs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site) and enable **Enforce HTTPS** under Settings -> Pages.
