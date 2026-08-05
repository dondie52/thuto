/**
 * Grading scales for the admission predictor, across African secondary exam systems.
 *
 * BGCSE remains the curated reference scale — Thuto's programme `minPoints` are all calibrated
 * to its 48-point best-six maximum. Every other syllabus is normalised onto a shared 0-100
 * attainment index so a student on any scale can be compared against those thresholds, and
 * onto a canonical band ladder so BGCSE-letter subject requirements can be evaluated ordinally.
 *
 * Profiles live in `./grading/*` by region; this module is the public surface. Nothing outside
 * this file should import the region modules directly.
 */

import {
  CANONICAL_BANDS,
  bandRank,
} from "./grading/builders.js";
import { SOUTHERN_PROFILES } from "./grading/southern.js";
import { EASTERN_PROFILES } from "./grading/eastern.js";
import { WESTERN_PROFILES } from "./grading/western.js";
import { NORTHERN_PROFILES } from "./grading/northern.js";
import { INTERNATIONAL_PROFILES } from "./grading/international.js";

export { CANONICAL_BANDS, bandRank };

/**
 * @typedef {'bestSix'|'aps'|'aggregatePoints'|'advancedPoints'|'meanGrade'|'totalScore'|'average20'|'percentage'|'ibTotal'} AggregateMode
 * @typedef {'higher_better'|'lower_better'} ScaleDirection
 * @typedef {import('./grading/builders.js').CanonicalBand} CanonicalBand
 * @typedef {import('./grading/builders.js').GradeOption} GradeOption
 *
 * @typedef {{
 *   id: string,
 *   label: string,
 *   abbreviation: string,
 *   aliases: string[],
 *   countries: string[],
 *   region: 'southern'|'eastern'|'western'|'central'|'northern'|'international',
 *   level: 'secondary'|'advanced',
 *   verified: boolean,
 *   sourceNote: string,
 *   grades: GradeOption[],
 *   direction: ScaleDirection,
 *   minPerSubject: number,
 *   maxPerSubject: number,
 *   subjectsCounted: number,
 *   aggregateBest: number,
 *   aggregateWorst: number,
 *   aggregate: AggregateMode,
 *   aggregateLabel: string,
 *   helpText: string,
 *   examBoards: string[],
 *   allowsScienceDouble: boolean,
 *   gradePoints: Record<string, number>,
 *   bandByGrade: Record<string, CanonicalBand>,
 * }} GradingProfile
 */

/** @type {Record<string, GradingProfile>} */
export const GRADING_PROFILES = {
  ...SOUTHERN_PROFILES,
  ...EASTERN_PROFILES,
  ...WESTERN_PROFILES,
  ...NORTHERN_PROFILES,
  ...INTERNATIONAL_PROFILES,
};

/**
 * Syllabus choices offered first for each market country. This is a default filter for the
 * picker, not a restriction — a Kenyan or Ghanaian student applying to Botswana institutions
 * can still search for and select their own system.
 */
export const SYLLABI_BY_COUNTRY = {
  bw: ["bgcse", "igcse", "as_level", "a_level", "o_level"],
  na: ["nssc", "igcse", "o_level", "as_level"],
  zw: ["zimsec_o", "zimsec_a", "igcse", "as_level", "a_level", "o_level"],
  zm: ["ecz", "igcse", "o_level", "as_level"],
  za: ["nsc_matric", "igcse", "as_level", "a_level"],
};

export const ALL_SYLLABUS_VALUES = Object.keys(GRADING_PROFILES);

/** ISO-2 codes beyond the market countries, for search and display in the picker. */
const COUNTRY_NAMES = {
  ao: "Angola", bf: "Burkina Faso", bj: "Benin", bw: "Botswana", cd: "DR Congo", ci: "Côte d'Ivoire",
  cm: "Cameroon", cv: "Cabo Verde", dz: "Algeria", eg: "Egypt", et: "Ethiopia", ga: "Gabon",
  gh: "Ghana", gw: "Guinea-Bissau", ke: "Kenya", ls: "Lesotho", ma: "Morocco", ml: "Mali",
  mu: "Mauritius", mw: "Malawi", mz: "Mozambique", na: "Namibia", ne: "Niger", ng: "Nigeria",
  rw: "Rwanda", sn: "Senegal", st: "São Tomé and Príncipe", sz: "Eswatini", tg: "Togo",
  tn: "Tunisia", tz: "Tanzania", ug: "Uganda", za: "South Africa", zm: "Zambia", zw: "Zimbabwe",
};

/** @param {string} code */
export function syllabusCountryName(code) {
  return COUNTRY_NAMES[String(code || "").toLowerCase()] || String(code || "").toUpperCase();
}

/**
 * @param {string | null | undefined} syllabusType
 * @returns {GradingProfile}
 */
export function getGradingProfile(syllabusType) {
  const id = String(syllabusType || "").trim();
  return GRADING_PROFILES[id] || GRADING_PROFILES.bgcse;
}

/**
 * @param {string | null | undefined} country
 * @returns {{ value: string, label: string }[]}
 */
export function syllabusOptionsForCountry(country) {
  const code = String(country || "bw").trim().toLowerCase();
  const ids = SYLLABI_BY_COUNTRY[code] || SYLLABI_BY_COUNTRY.bw;
  return ids.map((id) => ({
    value: id,
    label: GRADING_PROFILES[id]?.label || id,
  }));
}

/**
 * @param {string | null | undefined} country
 */
export function defaultSyllabusForCountry(country) {
  const opts = syllabusOptionsForCountry(country);
  return opts[0]?.value || "bgcse";
}

/**
 * @param {string | null | undefined} grade
 * @param {string | null | undefined} syllabusType
 * @returns {number | null}
 */
export function gradeToPointsForSyllabus(grade, syllabusType) {
  if (grade == null || String(grade).trim() === "") return null;
  const profile = getGradingProfile(syllabusType);
  const g = String(grade).trim().toUpperCase();
  if (Object.prototype.hasOwnProperty.call(profile.gradePoints, g)) {
    return profile.gradePoints[g];
  }
  // Numeric scales (ECZ, NSC, IB) are stored with numeric string keys.
  const asNum = String(Number(g));
  if (Object.prototype.hasOwnProperty.call(profile.gradePoints, asNum)) {
    return profile.gradePoints[asNum];
  }
  return null;
}

/**
 * The rung on the canonical ladder a native grade sits on. This is what subject requirements
 * compare against, because a requirement of "C" means the same thing on every scale while
 * 5 points does not.
 *
 * @param {string | null | undefined} grade
 * @param {string | null | undefined} syllabusType
 * @returns {CanonicalBand | null}
 */
export function gradeToBand(grade, syllabusType) {
  if (grade == null || String(grade).trim() === "") return null;
  const profile = getGradingProfile(syllabusType);
  const g = String(grade).trim().toUpperCase();
  if (profile.bandByGrade[g]) return profile.bandByGrade[g];
  const asNum = String(Number(g));
  if (profile.bandByGrade[asNum]) return profile.bandByGrade[asNum];
  // A bare canonical letter is always understood, so BGCSE-shaped data still resolves.
  return bandRank(g) >= 0 ? /** @type {CanonicalBand} */ (g) : null;
}

/**
 * @param {string | null | undefined} syllabusType
 * @returns {string[]}
 */
export function gradeOptionsForSyllabus(syllabusType) {
  return getGradingProfile(syllabusType).grades.map((g) => g.value);
}

/**
 * @param {string | null | undefined} syllabusType
 * @returns {GradeOption[]}
 */
export function gradeChoicesForSyllabus(syllabusType) {
  return getGradingProfile(syllabusType).grades;
}

// ---------------------------------------------------------------------------
// Cross-syllabus normalisation
// ---------------------------------------------------------------------------

/** BGCSE best-six maximum. Every `minPoints` in programmes.json is expressed against this. */
export const BGCSE_MAX_POINTS = 48;

/**
 * Place an aggregate on a 0-100 attainment index, handling scales where a lower total is a
 * stronger result (ECZ, WASSCE, MSCE, UCE, CSEE).
 *
 * @param {number} total
 * @param {GradingProfile} profile
 * @returns {number}
 */
export function attainmentIndex(total, profile) {
  const best = profile.aggregateBest;
  const worst = profile.aggregateWorst;
  if (!Number.isFinite(total) || best === worst) return 0;
  const raw = (total - worst) / (best - worst);
  return Math.max(0, Math.min(100, raw * 100));
}

/**
 * The same index for a programme threshold, which is always written on the BGCSE scale.
 * @param {number} minPoints
 * @returns {number}
 */
export function requiredIndexFromMinPoints(minPoints) {
  const value = Number(minPoints);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, (value / BGCSE_MAX_POINTS) * 100));
}

/**
 * Index back to BGCSE points, for display only — "≈ 34/48" means something to a student
 * looking at a Botswana catalogue in a way that "index 71" does not.
 * @param {number} index
 * @returns {number}
 */
export function indexToBgcsePoints(index) {
  return Math.round((Math.max(0, Math.min(100, index)) / 100) * BGCSE_MAX_POINTS);
}

export const CROSS_SYLLABUS_DISCLAIMER =
  "Thuto's minimum-points thresholds are published on the Botswana BGCSE 48-point best-six scale. " +
  "Your result is converted to an approximate equivalent so you can compare programmes. Conversions are " +
  "guidance only — every institution runs its own equivalency assessment. Always confirm entry requirements " +
  "with the institution before you apply.";

export const GUIDANCE_SCALE_NOTICE =
  "This grading scale has not been verified against an official source yet. Treat these results as a rough " +
  "indication only, and confirm your equivalency with the institution.";

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function normalizeQuery(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Rank syllabi against a free-text query. Abbreviation matches win, because that is what a
 * student types — "wassce", "waec", "matric", "kcse".
 *
 * @param {string} query
 * @param {{ country?: string | null, limit?: number }} [options]
 * @returns {GradingProfile[]}
 */
export function searchSyllabi(query, options = {}) {
  const { country, limit = 30 } = options;
  const q = normalizeQuery(query);
  const preferred = new Set(SYLLABI_BY_COUNTRY[String(country || "").toLowerCase()] || []);

  const all = Object.values(GRADING_PROFILES);
  if (!q) {
    return all
      .filter((profile) => (preferred.size ? preferred.has(profile.id) : true))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, limit);
  }

  const scored = [];
  for (const profile of all) {
    const abbr = normalizeQuery(profile.abbreviation);
    const label = normalizeQuery(profile.label);
    const aliases = profile.aliases.map(normalizeQuery);
    const countries = profile.countries.map((c) => normalizeQuery(syllabusCountryName(c)));

    let score = 0;
    if (abbr === q) score = 100;
    else if (abbr.startsWith(q)) score = 80;
    else if (aliases.some((a) => a === q)) score = 75;
    else if (aliases.some((a) => a.startsWith(q))) score = 60;
    else if (label.includes(q)) score = 45;
    else if (countries.some((c) => c.startsWith(q))) score = 40;
    else if (aliases.some((a) => a.includes(q))) score = 30;
    else if (countries.some((c) => c.includes(q))) score = 20;

    if (!score) continue;
    if (preferred.has(profile.id)) score += 5;
    scored.push({ profile, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.profile.label.localeCompare(b.profile.label))
    .slice(0, limit)
    .map((entry) => entry.profile);
}

/**
 * Picker groupings: what this student's country uses, then their region, then everything else.
 *
 * @param {string | null | undefined} country
 * @returns {{ title: string, profiles: GradingProfile[] }[]}
 */
export function groupedSyllabi(country) {
  const code = String(country || "bw").toLowerCase();
  const preferred = SYLLABI_BY_COUNTRY[code] || SYLLABI_BY_COUNTRY.bw;
  const preferredSet = new Set(preferred);
  const region = GRADING_PROFILES[preferred[0]]?.region || "southern";

  const regional = Object.values(GRADING_PROFILES).filter(
    (profile) => profile.region === region && !preferredSet.has(profile.id),
  );
  const rest = Object.values(GRADING_PROFILES).filter(
    (profile) => profile.region !== region && !preferredSet.has(profile.id),
  );

  return [
    { title: `Common in ${syllabusCountryName(code)}`, profiles: preferred.map((id) => GRADING_PROFILES[id]).filter(Boolean) },
    { title: "Elsewhere in the region", profiles: regional.sort((a, b) => a.label.localeCompare(b.label)) },
    { title: "Other systems", profiles: rest.sort((a, b) => a.label.localeCompare(b.label)) },
  ].filter((group) => group.profiles.length);
}
