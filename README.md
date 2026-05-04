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
