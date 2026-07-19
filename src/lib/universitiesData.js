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

import { fetchUniversityOverrides, mergeContentOverrides } from "./contentManagement.js";
import { filterByMarketCountry, resolveMarketCountry } from "./marketCountry.js";

const BUNDLED_PATH = `${import.meta.env.BASE_URL}data/universities.json`;

/** @type {string} */
const REMOTE_URL = (import.meta.env.VITE_UNIVERSITIES_REMOTE_URL || "").trim();

export const UNIVERSITY_CATEGORY_ORDER = [
  "universities",
  "technical-colleges-brigades",
  "specialised-academics",
  "biblical-theological-studies",
  "short-courses",
];

export const UNIVERSITY_CATEGORY_META = {
  universities: {
    label: "Universities",
    description: "Institutions with broader degree and diploma pathways, including the major universities and university colleges.",
  },
  "technical-colleges-brigades": {
    label: "Technical Colleges & Brigades",
    description:
      "Technical colleges, brigades, and other TVET providers offering certificates, diplomas, NCC-style pathways, and trade qualifications.",
  },
  "specialised-academics": {
    label: "Specialised Academics",
    description: "Single-industry institutions such as colleges of education, health and nursing schools, culinary academies, and focused professional institutes.",
  },
  "biblical-theological-studies": {
    label: "Biblical and Theological Studies",
    description:
      "Seminaries, bible colleges, and faith-based institutions offering biblical, ministerial, and theological qualifications.",
  },
  "short-courses": {
    label: "Short Courses",
    description: "Institutions that only offer short courses and skills programmes, with a maximum duration of six months.",
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
  kgale: "universities",
  isbs: "universities",
  idm: "universities",
  guc: "universities",
  buan: "universities",
  "logan-business-college": "universities",
  "mega-size-college": "universities",
  "homeland-college": "universities",
  "gaborone-commercial-college": "universities",
  tebelopele: "specialised-academics",
  "byte-size-college": "universities",
  "awil-college": "universities",
  gtc: "technical-colleges-brigades",
  bcet: "specialised-academics",
  fctve: "technical-colleges-brigades",
  oodi: "technical-colleges-brigades",
  realic: "technical-colleges-brigades",
  "palapye-technical-college": "technical-colleges-brigades",
  "jwaneng-technical-college": "technical-colleges-brigades",
  "maun-technical-college": "technical-colleges-brigades",
  "selebi-phikwe-technical-college": "technical-colleges-brigades",
  "botswana-accountancy-training": "short-courses",
  bohss: "specialised-academics",
  "fire-college": "specialised-academics",
  lcibs: "specialised-academics",
  ihs: "specialised-academics",
  "pillar-of-success": "specialised-academics",
  "kanye-sda-nursing": "specialised-academics",
  "bosa-bosele": "short-courses",
  "tlokweng-coe": "specialised-academics",
  "serowe-coe": "specialised-academics",
  "molepolole-coe": "specialised-academics",
  "roads-training-centre": "short-courses",
  "dawn-training": "short-courses",
  "cep-training": "short-courses",
  learneasy: "short-courses",
  stargems: "short-courses",
  gcca: "specialised-academics",
  "insurance-training-institute": "short-courses",
  crackit: "short-courses",
  "assembly-bible-college": "biblical-theological-studies",
  bibf: "specialised-academics",
  "tonota-coe": "specialised-academics",
  "bamalete-nursing": "specialised-academics",
  aafm: "short-courses",
  "africa-insurance-training-institute": "short-courses",
  "delta-training-academy": "short-courses",
  "naledi-training-institute": "specialised-academics",
  "elsimate-institute": "specialised-academics",
  "nampol-college-of-education": "specialised-academics",
  "chobe-brigade": "technical-colleges-brigades",
  "inchrist-bible-institute-university": "biblical-theological-studies",
  krda: "technical-colleges-brigades",
  "real-bible-school": "biblical-theological-studies",
  "rankuke-training-institute": "specialised-academics",
  "nhabe-tourism-training-centre": "specialised-academics",
  "career-dreams-centre": "specialised-academics",
  "lexie-training-investments": "specialised-academics",
  "belvans-institute": "specialised-academics",
  "mighty-skills-training-institute": "specialised-academics",
  "tsl-college": "specialised-academics",
  "ed-tech-africa": "short-courses",
  "kalahari-training-institute": "short-courses",
  "rutegang-training-college": "short-courses",
  "kago-international-serminary-college": "biblical-theological-studies",
  "azusa-academy-of-excellence": "biblical-theological-studies",
  "botswana-wildlife-training-institute": "specialised-academics",
  "central-college-of-modern-arts-creative-technology": "specialised-academics",
  "serala-entrepreneurship-college": "specialised-academics",
  "diamond-academy-of-botswana": "specialised-academics",
  "institute-of-energy-technology-development": "specialised-academics",
  "institute-of-health-and-fire-safety": "specialised-academics",
  "boswa-culinary-institute-of-botswana": "specialised-academics",
  "textile-clothing-institute-of-botswana": "specialised-academics",
  "phronesis-international-college": "specialised-academics",
  "ddt-college-of-medicine": "specialised-academics",
  "kitso-international-college": "universities",
  "arthur-portland-college": "specialised-academics",
  "kings-college": "universities",
  "institute-for-labour-and-employment-studies": "specialised-academics",
  "southwest-training-institute": "short-courses",
  "vocational-and-creativity-institute": "technical-colleges-brigades",
  "moeti-practicum-institute": "specialised-academics",
  "missions-bible-college-botswana": "biblical-theological-studies",
  // Namibia (NQA-accredited catalogue)
  "international-university-of-management": "universities",
  "welwitchia-university": "universities",
  "botho-namibia": "universities",
  "limkokwing-namibia": "universities",
  "institute-for-open-learning": "universities",
  "namibian-college-of-open-learning": "universities",
  "sunshine-private-college": "universities",
  "college-of-the-arts": "specialised-academics",
  "namibia-evangelical-theological-seminary": "biblical-theological-studies",
  "united-lutheran-theological-seminary": "biblical-theological-studies",
  "st-charles-lwanga-major-seminary": "biblical-theological-studies",
  // Zimbabwe
  "university-of-zimbabwe": "universities",
  "national-university-of-science-and-technology-zimbabwe": "universities",
  "midlands-state-university": "universities",
  "africa-university": "universities",
  "zimbabwe-open-university": "universities",
  "harare-institute-of-technology": "universities",
  // Zambia
  "university-of-zambia": "universities",
  "copperbelt-university": "universities",
  "mulungushi-university": "universities",
  "cavendish-university": "universities",
  "chalimbana-university": "universities",
  // South Africa (private HEIs from DHET register)
  "the-independent-institute-of-education": "universities",
  "eduvos": "universities",
  "stadio": "universities",
  "regent-business-school": "universities",
  "da-vinci-institute-for-technology-management": "universities",
  "milpark": "universities",
};

/**
 * @param {Record<string, unknown>} university
 * @returns {'universities' | 'technical-colleges-brigades' | 'specialised-academics' | 'biblical-theological-studies' | 'short-courses'}
 */
export function categorizeUniversity(university) {
  const mapped = UNIVERSITY_CATEGORY_BY_ID[university.id];
  if (mapped) return mapped;

  const name = String(university.name || "").toLowerCase();
  if (
    name.includes("brigade") ||
    name.includes("technical") ||
    name.includes("vocational training") ||
    name.includes("tvet") ||
    name.includes(" vtc") ||
    /\bvtc\b/.test(name)
  ) {
    return "technical-colleges-brigades";
  }
  if (name.includes("seminary") || name.includes("theological") || name.includes("bible")) {
    return "biblical-theological-studies";
  }
  if (name.includes("university")) return "universities";
  return "specialised-academics";
}

/**
 * @param {Record<string, unknown>[]} universities
 * @returns {{ key: 'universities' | 'technical-colleges-brigades' | 'specialised-academics' | 'biblical-theological-studies' | 'short-courses', label: string, description: string, items: Record<string, unknown>[] }[]}
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
 * @param {{
 *   signal?: AbortSignal,
 *   includeDrafts?: boolean,
 *   country?: string | null,
 *   includeAllCountries?: boolean,
 * }} [options]
 * @returns {Promise<{ list: object[], source: 'remote' | 'bundled' | 'live' }>}
 */
export async function fetchUniversities(options = {}) {
  const { signal, includeDrafts = false, country, includeAllCountries = false } = options;
  const market = includeAllCountries ? "all" : country === undefined ? resolveMarketCountry() : country;

  async function loadBundled() {
    const r = await fetch(BUNDLED_PATH, { signal, cache: "no-store" });
    if (!r.ok) throw new Error("Could not load universities");
    const data = await r.json();
    const list = normalizeList(data);
    if (!list) throw new Error("Invalid universities data");
    return list;
  }

  async function mergeLiveOverrides(list, source) {
    const overrides = await fetchUniversityOverrides({ includeDrafts });
    if (!overrides.length) return { list, source };
    return { list: mergeContentOverrides(list, overrides), source: "live" };
  }

  function scope(list, source) {
    return {
      list: filterByMarketCountry(list, market, { includeAllCountries }),
      source,
    };
  }

  if (!REMOTE_URL) {
    const list = await loadBundled();
    const merged = await mergeLiveOverrides(list, "bundled");
    return scope(merged.list, merged.source);
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
      return scope(list, "bundled");
    }
    const data = await r.json();
    const remote = normalizeList(data);
    if (!remote?.length) {
      const list = await loadBundled();
      return scope(list, "bundled");
    }
    const base = await loadBundled();
    const list = mergeUniversityRecords(base, remote);
    const merged = await mergeLiveOverrides(list, "remote");
    return scope(merged.list, merged.source);
  } catch {
    const list = await loadBundled();
    const merged = await mergeLiveOverrides(list, "bundled");
    return scope(merged.list, merged.source);
  }
}

/** True when build was configured to prefer a remote feed for dates/metadata */
export function hasRemoteUniversitiesFeed() {
  return Boolean(REMOTE_URL);
}
