import { fetchProgrammeOverrides, mergeContentOverrides } from "./contentManagement.js";
import { filterByMarketCountry, resolveMarketCountry } from "./marketCountry.js";

const PROGRAMMES_PATH = `${import.meta.env.BASE_URL}data/programmes.json`;

/** @param {string} path */
function withCacheBuster(path, cacheBuster) {
  if (cacheBuster == null || cacheBuster === "") return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}d=${encodeURIComponent(String(cacheBuster))}`;
}

/**
 * @param {{
 *   signal?: AbortSignal,
 *   cacheBuster?: string,
 *   includeDrafts?: boolean,
 *   country?: string | null,
 *   includeAllCountries?: boolean,
 *   includeArchived?: boolean,
 * }} [options]
 */
export async function fetchProgrammes(options = {}) {
  const {
    signal,
    cacheBuster,
    includeDrafts = false,
    country,
    includeAllCountries = false,
    includeArchived = false,
  } = options;
  const market = includeAllCountries ? "all" : country === undefined ? resolveMarketCountry() : country;
  const url = withCacheBuster(PROGRAMMES_PATH, cacheBuster);
  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Could not load programmes");
  const data = await response.json();
  const bundled = Array.isArray(data) ? data : [];
  const overrides = await fetchProgrammeOverrides({ includeDrafts });
  const merged = mergeContentOverrides(bundled, overrides);
  // Archiving hides a bundled programme the CMS cannot delete outright. The CMS itself passes
  // includeArchived so partner staff can still find and restore it.
  const visible = includeArchived ? merged : merged.filter((programme) => !programme.archived);
  return filterByMarketCountry(visible, market, { includeAllCountries });
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const UNIVERSITY_ALIASES = {
  ub: ["University of Botswana", "UB"],
  biust: ["BIUST", "Botswana International University of Science and Technology", "Botswana international university of science and technology"],
  bac: ["Botswana School of Business Sciences", "Botswana school of business sciences", "BAC", "BSBS"],
  botho: ["Botho University", "Botho", "Botho university"],
  "ba-isago": ["BA ISAGO University", "BA ISAGO"],
  abm: ["ABM University College", "ABM"],
  limkokwing: ["Limkokwing University of Creative Technology", "Limkokwing", "limkonkwing university of creative technology"],
  gtc: ["Gaborone Technical College"],
  bou: ["Botswana Open University", "BOU"],
  boitekanelo: ["Boitekanelo College"],
  "new-era": ["New Era College"],
  gips: ["Gaborone Institute of Professional Studies", "GIPS"],
  "botswana-accountancy-training": ["Botswana Institute of Chartered Accountants Training Centre"],
  "chobe-brigade": ["Chobe Brigade", "Chobe Vocational Training Centre"],
  krda: ["KRDA (Kweneng Rural Development Association)", "KRDA", "Kweneng Rural Development Association"],
  kgale: ["Kgale College"],
  bohss: ["Botswana Harvard Health Sciences"],
  idm: [
    "Institute of Development Management (IDM) Botswana",
    "Institute of Development Management",
    "Institute of Development Management (IDM)",
    "IDM",
  ],
  "fire-college": [
    "College of Fire & Safety (Fire College)",
    "College of Fire and Safety",
    "College of fire and Safety",
    "Fire College",
    "COFS",
  ],
  lcibs: [
    "London College of International Business Studies (LCIBS) Botswana",
    "London College of International Business Studies",
    "London college of international Business",
    "LCIBS",
  ],
  bcet: [
    "Botswana College of Engineering and Technology (BCET)",
    "Botswana College of Engineering and Technology",
    "Botswana college of engineering and technology",
    "BCET",
  ],
  fctve: [
    "Francistown College of Technical and Vocational Education",
    "Francistown College of Technical & Vocational Education",
  ],
  ihs: ["Institute of Health Sciences (IHS)", "Institute of Health Sciences", "Institute of Health Sciences Botswana", "IHS"],
  guc: [
    "Gaborone University College (GUC)",
    "Gaborone University College",
    "Gaborone university college of law and professional studies",
    "Gaborone University College of Law and Professional Studies",
    "GUC",
  ],
  "pillar-of-success": [
    "Pillar of Success Training Institute",
    "Pillar of Success",
    "Pillar of Success Training Institute Botswana",
  ],
  oodi: [
    "Oodi College of Applied Arts and Technology",
    "Oodi College of Applied Arts & Technology",
    "Oodi College of Applied Arts and Technology (OCAAT)",
    "OCAAT",
  ],
  "naledi-training-institute": ["Naledi Training Institute", "NTI"],
  "elsimate-institute": ["ElsiMate Institute", "Elsimate Institute", "ELSIMATE INSTITUTE", "ElsiMate"],
  "nampol-college-of-education": ["Nampol College of Education", "Nampol College Of Education", "NCE"],
};

export function programmeBelongsToUniversity(programme, university) {
  // `canonicalName` is the pre-override name, kept so an institution renaming itself in the CMS
  // does not detach its own programmes. Only 29 of 389 institutions have an alias entry.
  const aliases = UNIVERSITY_ALIASES[university.id] ?? [];
  const aliasSet = new Set([...aliases, university.name, university.canonicalName].filter(Boolean).map(normalize));
  const short = normalize(programme.universityShort);
  const full = normalize(programme.university);
  return aliasSet.has(short) || aliasSet.has(full);
}
