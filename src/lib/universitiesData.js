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

export const UNIVERSITY_CATEGORY_ORDER = [
  "universities",
  "technical-colleges",
  "specialised-academics",
  "brigades",
];

export const UNIVERSITY_CATEGORY_META = {
  universities: {
    label: "Universities",
    description: "Institutions with broader degree and diploma pathways, including the major universities and university colleges.",
  },
  "technical-colleges": {
    label: "Technical Colleges",
    description: "Technical and vocational colleges focused on diplomas, certificates, and NCC-style pathways.",
  },
  "specialised-academics": {
    label: "Specialised Academics",
    description: "Single-industry institutions such as colleges of education, health and nursing schools, culinary academies, and focused professional institutes.",
  },
  brigades: {
    label: "Brigades",
    description: "Brigade and brigade-style vocational training institutions.",
  },
};

const UNIVERSITY_CATEGORY_BY_ID = {
  ub: "universities",
  biust: "universities",
  bac: "universities",
  botho: "universities",
  "ba-isago": "universities",
  abm: "universities",
  limkokwing: "universities",
  bou: "universities",
  boitekanelo: "universities",
  "new-era": "universities",
  gips: "universities",
  bocodol: "universities",
  kgale: "universities",
  isbs: "universities",
  idm: "universities",
  guc: "universities",
  buan: "universities",
  "logan-business-college": "universities",
  "mega-size-college": "universities",
  "homeland-college": "universities",
  "gaborone-commercial-college": "universities",
  tebelopele: "universities",
  "byte-size-college": "universities",
  "awil-college": "universities",
  gtc: "technical-colleges",
  bcet: "technical-colleges",
  fctve: "technical-colleges",
  oodi: "technical-colleges",
  realic: "technical-colleges",
  "palapye-technical-college": "technical-colleges",
  "jwaneng-technical-college": "technical-colleges",
  "botswana-accountancy-training": "specialised-academics",
  bohss: "specialised-academics",
  "fire-college": "specialised-academics",
  lcibs: "specialised-academics",
  ihs: "specialised-academics",
  "pillar-of-success": "specialised-academics",
  "kanye-sda-nursing": "specialised-academics",
  "bosa-bosele": "specialised-academics",
  "tlokweng-coe": "specialised-academics",
  "serowe-coe": "specialised-academics",
  "molepolole-coe": "specialised-academics",
  "roads-training-centre": "specialised-academics",
  "dawn-training": "specialised-academics",
  "cep-training": "specialised-academics",
  learneasy: "specialised-academics",
  stargems: "specialised-academics",
  gcca: "specialised-academics",
  "insurance-training-institute": "specialised-academics",
  crackit: "specialised-academics",
  "assembly-bible-college": "specialised-academics",
  bibf: "specialised-academics",
  "tonota-coe": "specialised-academics",
  "bamalete-nursing": "specialised-academics",
  aafm: "specialised-academics",
  "africa-insurance-training-institute": "specialised-academics",
  "delta-training-academy": "specialised-academics",
  "naledi-training-institute": "specialised-academics",
  "elsimate-institute": "specialised-academics",
  "nampol-college-of-education": "specialised-academics",
  "chobe-brigade": "brigades",
  krda: "brigades",
};

/**
 * @param {Record<string, unknown>} university
 * @returns {'universities' | 'technical-colleges' | 'specialised-academics' | 'brigades'}
 */
export function categorizeUniversity(university) {
  const mapped = UNIVERSITY_CATEGORY_BY_ID[university.id];
  if (mapped) return mapped;

  const name = String(university.name || "").toLowerCase();
  if (name.includes("brigade")) return "brigades";
  if (name.includes("technical")) return "technical-colleges";
  if (name.includes("university")) return "universities";
  return "specialised-academics";
}

/**
 * @param {Record<string, unknown>[]} universities
 * @returns {{ key: 'universities' | 'technical-colleges' | 'specialised-academics' | 'brigades', label: string, description: string, items: Record<string, unknown>[] }[]}
 */
export function groupUniversitiesByCategory(universities) {
  return UNIVERSITY_CATEGORY_ORDER.map((key) => ({
    key,
    label: UNIVERSITY_CATEGORY_META[key].label,
    description: UNIVERSITY_CATEGORY_META[key].description,
    items: universities.filter((university) => categorizeUniversity(university) === key),
  }));
}

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
