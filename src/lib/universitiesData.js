/**
 * University list + application windows.
 *
 * When `VITE_UNIVERSITIES_REMOTE_URL` is set at build time, the app fetches that URL
 * on each load (cache: no-store) and merges the result into the bundled
 * `public/data/universities.json` by matching `id`. Use this to ship live-updated
 * dates from your own CDN, gist, or API without redeploying the PWA.
 *
 * Official sites rarely offer CORS-friendly JSON; this is the practical pattern.
 */

const BUNDLED_PATH = `${import.meta.env.BASE_URL}data/universities.json`;

/** @type {string} */
const REMOTE_URL = (import.meta.env.VITE_UNIVERSITIES_REMOTE_URL || "").trim();

/**
 * @param {object[]} base
 * @param {object[]} overlays
 * @returns {object[]}
 */
export function mergeUniversityRecords(base, overlays) {
  const byId = new Map(base.map((u) => [u.id, { ...u }]));
  for (const patch of overlays) {
    if (!patch || typeof patch !== "object" || !patch.id) continue;
    const cur = byId.get(patch.id);
    byId.set(patch.id, cur ? { ...cur, ...patch } : { ...patch });
  }
  const ordered = base.map((u) => byId.get(u.id)).filter(Boolean);
  const baseIds = new Set(base.map((b) => b.id));
  for (const patch of overlays) {
    if (patch?.id && !baseIds.has(patch.id) && byId.has(patch.id)) {
      ordered.push(byId.get(patch.id));
    }
  }
  return ordered;
}

/**
 * @param {unknown} data
 * @returns {object[] | null}
 */
function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(/** @type {{ universities?: unknown }} */ (data).universities)) {
    return /** @type {object[]} */ (/** @type {{ universities: object[] }} */ (data).universities);
  }
  return null;
}

/**
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ list: object[], source: 'remote' | 'bundled' }>}
 */
export async function fetchUniversities(options = {}) {
  const { signal } = options;

  async function loadBundled() {
    const r = await fetch(BUNDLED_PATH, { signal, cache: "no-store" });
    if (!r.ok) throw new Error("Could not load universities");
    const data = await r.json();
    const list = normalizeList(data);
    if (!list) throw new Error("Invalid universities data");
    return list;
  }

  if (!REMOTE_URL) {
    const list = await loadBundled();
    return { list, source: "bundled" };
  }

  try {
    const r = await fetch(REMOTE_URL, {
      signal,
      cache: "no-store",
      mode: "cors",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) {
      const list = await loadBundled();
      return { list, source: "bundled" };
    }
    const data = await r.json();
    const remote = normalizeList(data);
    if (!remote?.length) {
      const list = await loadBundled();
      return { list, source: "bundled" };
    }
    const base = await loadBundled();
    const list = mergeUniversityRecords(base, remote);
    return { list, source: "remote" };
  } catch {
    const list = await loadBundled();
    return { list, source: "bundled" };
  }
}

/** True when build was configured to prefer a remote feed for dates/metadata */
export function hasRemoteUniversitiesFeed() {
  return Boolean(REMOTE_URL);
}
