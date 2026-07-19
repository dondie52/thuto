/**
 * Per-syllabus grading scales for the admission predictor.
 * BGCSE remains the primary curated scale; other markets use practical guidance scales.
 */

/** @typedef {'bestSix' | 'aps'} AggregateMode */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   countries: string[],
 *   gradePoints: Record<string, number>,
 *   aggregate: AggregateMode,
 *   aggregateLabel: string,
 *   helpText: string,
 *   allowsScienceDouble?: boolean,
 * }} GradingProfile
 */

/** @type {Record<string, GradingProfile>} */
export const GRADING_PROFILES = {
  bgcse: {
    id: "bgcse",
    label: "BGCSE",
    countries: ["bw"],
    gradePoints: { "A*": 8, A: 8, B: 7, C: 6, D: 5, E: 4, F: 3, G: 2, U: 0 },
    aggregate: "bestSix",
    aggregateLabel: "Best-six total",
    helpText: "Official Botswana BGCSE points. Best six subjects count (max 48).",
    allowsScienceDouble: true,
  },
  igcse: {
    id: "igcse",
    label: "IGCSE",
    countries: ["bw", "na", "zw", "zm", "za"],
    gradePoints: { "A*": 8, A: 8, B: 7, C: 6, D: 5, E: 4, F: 3, G: 2, U: 0 },
    aggregate: "bestSix",
    aggregateLabel: "Best-six total",
    helpText: "IGCSE letter grades mapped to a best-six style total for guidance matching.",
    allowsScienceDouble: true,
  },
  as_level: {
    id: "as_level",
    label: "AS Level",
    countries: ["bw", "zw", "zm", "za"],
    gradePoints: { A: 5, B: 4, C: 3, D: 2, E: 1, U: 0 },
    aggregate: "bestSix",
    aggregateLabel: "AS points total",
    helpText: "AS Level A–E scale for guidance. Confirm official university equivalencies.",
    allowsScienceDouble: false,
  },
  o_level: {
    id: "o_level",
    label: "O-Level",
    countries: ["bw", "zw", "zm"],
    gradePoints: { A: 8, B: 7, C: 6, D: 5, E: 4, F: 3, G: 2, U: 0 },
    aggregate: "bestSix",
    aggregateLabel: "Best-six total",
    helpText: "O-Level letter grades with a best-six style total for guidance matching.",
    allowsScienceDouble: false,
  },
  nssc: {
    id: "nssc",
    label: "NSSC",
    countries: ["na"],
    gradePoints: { "A*": 8, A: 8, B: 7, C: 6, D: 5, E: 4, F: 3, G: 2, U: 0 },
    aggregate: "bestSix",
    aggregateLabel: "Best-six total",
    helpText: "Namibia NSSC letter grades (guidance scale). Confirm official institutional conversions.",
    allowsScienceDouble: false,
  },
  zimsec_o: {
    id: "zimsec_o",
    label: "ZIMSEC O-Level",
    countries: ["zw"],
    gradePoints: { A: 8, B: 7, C: 6, D: 5, E: 4, F: 3, G: 2, U: 0 },
    aggregate: "bestSix",
    aggregateLabel: "Best-six total",
    helpText: "ZIMSEC O-Level guidance scale. Many Zimbabwe programmes also expect A-Level passes.",
    allowsScienceDouble: false,
  },
  zimsec_a: {
    id: "zimsec_a",
    label: "ZIMSEC A-Level",
    countries: ["zw"],
    gradePoints: { A: 5, B: 4, C: 3, D: 2, E: 1, U: 0 },
    aggregate: "bestSix",
    aggregateLabel: "A-Level points total",
    helpText: "ZIMSEC A-Level A–E guidance scale. Universities often require specific subject passes.",
    allowsScienceDouble: false,
  },
  ecz: {
    id: "ecz",
    label: "ECZ School Certificate",
    countries: ["zm"],
    // ECZ 1 is strongest; invert to points so higher totals are better for matching UI.
    gradePoints: { 1: 9, 2: 8, 3: 7, 4: 6, 5: 5, 6: 4, 7: 3, 8: 2, 9: 1 },
    aggregate: "bestSix",
    aggregateLabel: "Best-six points (converted)",
    helpText: "ECZ grades 1–9 (1 is strongest) converted to points for guidance. Confirm official cut-offs.",
    allowsScienceDouble: false,
  },
  nsc_matric: {
    id: "nsc_matric",
    label: "NSC Matric (APS)",
    countries: ["za"],
    gradePoints: { 7: 7, 6: 6, 5: 5, 4: 4, 3: 3, 2: 2, 1: 1 },
    aggregate: "aps",
    aggregateLabel: "APS total",
    helpText:
      "NSC achievement levels mapped 1:1 to APS for guidance (Life Orientation often excluded by universities — confirm).",
    allowsScienceDouble: false,
  },
};

/** Syllabus choices shown per market country. */
export const SYLLABI_BY_COUNTRY = {
  bw: ["bgcse", "igcse", "as_level", "o_level"],
  na: ["nssc", "igcse", "o_level"],
  zw: ["zimsec_o", "zimsec_a", "igcse", "as_level", "o_level"],
  zm: ["ecz", "igcse", "o_level"],
  za: ["nsc_matric", "igcse", "as_level"],
};

export const ALL_SYLLABUS_VALUES = Object.keys(GRADING_PROFILES);

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
  // Numeric ECZ / APS levels
  if (Object.prototype.hasOwnProperty.call(profile.gradePoints, g)) {
    return profile.gradePoints[g];
  }
  const asNum = String(Number(g));
  if (Object.prototype.hasOwnProperty.call(profile.gradePoints, asNum)) {
    return profile.gradePoints[asNum];
  }
  return null;
}

/**
 * @param {string | null | undefined} syllabusType
 * @returns {string[]}
 */
export function gradeOptionsForSyllabus(syllabusType) {
  const profile = getGradingProfile(syllabusType);
  return Object.keys(profile.gradePoints);
}
