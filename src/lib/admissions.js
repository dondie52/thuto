import { SCIENCE_DOUBLE_SUBJECT_ID, SUBJECTS_BY_ID } from "./bgcseSubjects.js";
import {
  ALL_SYLLABUS_VALUES,
  attainmentIndex,
  bandRank,
  getGradingProfile,
  gradeToBand,
  gradeToPointsForSyllabus,
  indexToBgcsePoints,
  requiredIndexFromMinPoints,
} from "./gradingSystems.js";

const GRADING_PROFILE_IDS = new Set(ALL_SYLLABUS_VALUES);

export { SCIENCE_DOUBLE_SUBJECT_ID };

const DEFAULT_SYLLABUS = "bgcse";

/**
 * Official Botswana BGCSE grade points for admission scoring.
 * Best-six maximum total = 48 (six A grades at 8 points each).
 * A* counts the same as A under UB/BIUST admissions guides.
 *
 * @deprecated Read `getGradingProfile(syllabusType).gradePoints` instead — this map is BGCSE-only
 * and is kept because it is a documented public export.
 */
export const GRADE_POINTS = getGradingProfile(DEFAULT_SYLLABUS).gradePoints;

/** Labels for `subjectRequirements` keys in programmes.json (eligibility messages). */
export const SUBJECT_FIELDS = [
  { key: "math", label: "Mathematics" },
  { key: "english", label: "English Language" },
  { key: "science", label: "Science" },
  { key: "socialStudies", label: "Social Studies" },
  { key: "setswana", label: "Setswana" },
  { key: "businessStudies", label: "Business Studies" },
];

/**
 * @param {string | undefined | null} grade
 * @param {string | null | undefined} [syllabusType]
 * @returns {number | null}
 */
export function gradeToPoints(grade, syllabusType) {
  return gradeToPointsForSyllabus(grade, syllabusType || DEFAULT_SYLLABUS);
}

/**
 * Science Double Award uses two component grades; admission points are the sum of both.
 * @param {string | undefined | null} grade1
 * @param {string | undefined | null} [grade2]
 */
export function scienceDoubleAwardPoints(grade1, grade2, syllabusType) {
  const g1 = gradeToPoints(grade1, syllabusType);
  const g2 = gradeToPoints(grade2, syllabusType);
  if (g1 == null || g2 == null) return null;
  return g1 + g2;
}

/**
 * Parse a combined double-award grade string (e.g. "CC", "A*B") into two components.
 * Only letter-grade syllabi issue Science Double Award, so anything else short-circuits.
 *
 * @param {string | undefined | null} combined
 * @param {string | null | undefined} [syllabusType]
 * @returns {{ grade1: string, grade2: string } | null}
 */
export function parseDoubleAwardGrades(combined, syllabusType) {
  const profile = getGradingProfile(syllabusType || DEFAULT_SYLLABUS);
  if (!profile.allowsScienceDouble) return null;
  const raw = String(combined || "").trim().toUpperCase();
  if (!raw) return null;
  if (raw.startsWith("A*") && raw.length >= 3) {
    const g1 = "A*";
    const g2 = raw.slice(2, 3);
    if (gradeToPoints(g2, profile.id) != null) return { grade1: g1, grade2: g2 };
  }
  if (raw.length >= 2) {
    const g1 = raw[0];
    const g2 = raw[1];
    if (gradeToPoints(g1, profile.id) != null && gradeToPoints(g2, profile.id) != null) {
      return { grade1: g1, grade2: g2 };
    }
  }
  return null;
}

/**
 * Weaker of two grades (used for programme science requirements).
 *
 * Compared by canonical band, not by points: on a `lower_better` scale like ECZ a *smaller*
 * number is the stronger grade, so comparing raw points would pick the wrong one.
 *
 * @param {string | undefined | null} grade1
 * @param {string | undefined | null} grade2
 * @param {string | null | undefined} [syllabusType]
 */
export function weakerGrade(grade1, grade2, syllabusType) {
  const syllabus = syllabusType || DEFAULT_SYLLABUS;
  const r1 = bandRank(gradeToBand(grade1, syllabus));
  const r2 = bandRank(gradeToBand(grade2, syllabus));
  if (r1 < 0 || r2 < 0) return null;
  return r1 <= r2 ? String(grade1).trim().toUpperCase() : String(grade2).trim().toUpperCase();
}

/**
 * @param {{ subjectId: string, grade: string, grade2?: string }} row
 * @param {string | null | undefined} [syllabusType]
 */
export function rowAdmissionPoints(row, syllabusType) {
  if (row.subjectId === SCIENCE_DOUBLE_SUBJECT_ID) {
    return scienceDoubleAwardPoints(row.grade, row.grade2, syllabusType);
  }
  return gradeToPoints(row.grade, syllabusType);
}

/**
 * @param {{ subjectId: string, grade: string, grade2?: string }} row
 */
export function formatRowGradeDisplay(row) {
  if (row.subjectId === SCIENCE_DOUBLE_SUBJECT_ID && row.grade?.trim() && row.grade2?.trim()) {
    return `${row.grade.trim().toUpperCase()}${row.grade2.trim().toUpperCase()}`;
  }
  return row.grade?.trim().toUpperCase() || "";
}

/**
 * Aggregate of the counted subjects from entered grades (fewer entered → sum all of them).
 * The number counted and which end of the scale is "best" both come from the syllabus profile.
 *
 * @param {Record<string, string>} gradesBySubject
 * @param {string | null | undefined} [syllabusType]
 */
export function computeBestSixTotal(gradesBySubject, syllabusType) {
  const profile = getGradingProfile(syllabusType || DEFAULT_SYLLABUS);
  const pointsList = [];
  for (const grade of Object.values(gradesBySubject)) {
    const p = gradeToPoints(grade, profile.id);
    if (p != null) pointsList.push(p);
  }
  pointsList.sort((a, b) => (profile.direction === "lower_better" ? a - b : b - a));
  return pointsList.slice(0, profile.subjectsCounted).reduce((sum, p) => sum + p, 0);
}

/**
 * @typedef {{ subjectId: string, grade: string, grade2?: string }} GradeRow
 * @typedef {{ subjectId: string, label: string, grade: string, points: number }} CountedEntry
 */

/**
 * Best-six (or APS-style) breakdown from distinct subject rows.
 * @param {GradeRow[]} rows
 * @param {string | null | undefined} [syllabusType]
 * @returns {{ total: number, counted: CountedEntry[], dropped: CountedEntry[], invalid: string | null, aggregateLabel?: string }}
 */
export function computeBestSixBreakdown(rows, syllabusType) {
  const profile = getGradingProfile(syllabusType || "bgcse");
  const scored = [];
  for (const row of rows) {
    const g = row.grade?.trim();
    if (!g) continue;
    const meta = SUBJECTS_BY_ID[row.subjectId];
    if (!meta) {
      return { total: 0, counted: [], dropped: [], invalid: "Unknown subject in row.", aggregateLabel: profile.aggregateLabel };
    }

    if (row.subjectId === SCIENCE_DOUBLE_SUBJECT_ID) {
      if (!profile.allowsScienceDouble) {
        return {
          total: 0,
          counted: [],
          dropped: [],
          invalid: `${profile.label} does not use Science Double Award in this predictor. Choose single subjects.`,
          aggregateLabel: profile.aggregateLabel,
        };
      }
      const g2 = row.grade2?.trim();
      if (!g2) {
        return {
          total: 0,
          counted: [],
          dropped: [],
          invalid: `${meta.label} needs two component grades (e.g. CC or BB).`,
          aggregateLabel: profile.aggregateLabel,
        };
      }
      const p = scienceDoubleAwardPoints(g, g2, syllabusType);
      if (p == null) {
        return {
          total: 0,
          counted: [],
          dropped: [],
          invalid: `Invalid grades for ${meta.label}.`,
          aggregateLabel: profile.aggregateLabel,
        };
      }
      scored.push({
        subjectId: row.subjectId,
        label: meta.label,
        grade: formatRowGradeDisplay(row),
        points: p,
      });
      continue;
    }

    const p = gradeToPoints(g, syllabusType);
    if (p == null) {
      return {
        total: 0,
        counted: [],
        dropped: [],
        invalid: `Invalid grade for ${meta.label} under ${profile.label}.`,
        aggregateLabel: profile.aggregateLabel,
      };
    }
    scored.push({
      subjectId: row.subjectId,
      label: meta.label,
      grade: g.toUpperCase(),
      points: p,
    });
  }
  if (scored.length === 0) {
    return { total: 0, counted: [], dropped: [], invalid: null, aggregateLabel: profile.aggregateLabel };
  }
  // "Best" is the smallest number on scales like ECZ, WASSCE and MSCE, so the sort direction
  // has to follow the profile or the aggregate counts a student's six *worst* subjects.
  const sorted = [...scored].sort((a, b) =>
    profile.direction === "lower_better"
      ? a.points - b.points || a.label.localeCompare(b.label)
      : b.points - a.points || a.label.localeCompare(b.label),
  );
  const counted = sorted.slice(0, profile.subjectsCounted);
  const dropped = sorted.slice(profile.subjectsCounted);
  const total = counted.reduce((s, e) => s + e.points, 0);
  const index = attainmentIndex(total, profile);
  return {
    total,
    counted,
    dropped,
    invalid: null,
    aggregateLabel: profile.aggregateLabel,
    index,
    bgcseEquivalent: indexToBgcsePoints(index),
    syllabusType: profile.id,
  };
}

/**
 * Fold predictor rows into requirement keys for programmes.json checks.
 * When several rows map to the same key (e.g. Biology + Physics → science), keep the best grade.
 *
 * Returns **canonical bands**, not native grades. Requirements in programmes.json are written as
 * BGCSE letters ("english": "C"), so a South African achievement level or a Zambian numeric
 * grade can only be evaluated against them ordinally. Returning native grades here is what made
 * every NSC and ECZ student fail every subject requirement.
 *
 * @param {GradeRow[]} rows
 * @param {string | null | undefined} [syllabusType]
 * @returns {Record<string, string>} requirement key → canonical band
 */
export function rowsToRequirementGrades(rows, syllabusType) {
  const syllabus = syllabusType || DEFAULT_SYLLABUS;
  /** @type {Record<string, { band: string, rank: number }>} */
  const best = {};
  for (const row of rows) {
    const g = row.grade?.trim();
    if (!g) continue;
    const meta = SUBJECTS_BY_ID[row.subjectId];
    if (!meta?.requirementKey) continue;
    const k = meta.requirementKey;

    const grade = row.subjectId === SCIENCE_DOUBLE_SUBJECT_ID ? weakerGrade(g, row.grade2, syllabus) : g;
    if (grade == null) continue;

    const band = gradeToBand(grade, syllabus);
    const rank = bandRank(band);
    if (rank < 0) continue;
    if (best[k] == null || rank > best[k].rank) {
      best[k] = { band: /** @type {string} */ (band), rank };
    }
  }
  return Object.fromEntries(Object.entries(best).map(([k, v]) => [k, v.band]));
}

/**
 * User meets the requirement if their band is the same or better (B satisfies "C").
 *
 * Both sides are canonical bands: the left comes from `rowsToRequirementGrades`, the right is a
 * BGCSE letter straight out of programmes.json. No syllabus argument is needed precisely because
 * the comparison is scale-free.
 *
 * @param {string | null | undefined} userBand
 * @param {string | null | undefined} requiredGrade
 */
export function meetsSubjectRequirement(userBand, requiredGrade) {
  const u = bandRank(gradeToBand(userBand, DEFAULT_SYLLABUS));
  const r = bandRank(gradeToBand(requiredGrade, DEFAULT_SYLLABUS));
  if (u < 0 || r < 0) return false;
  return u >= r;
}

const LABELS = Object.fromEntries(SUBJECT_FIELDS.map(({ key, label }) => [key, label]));

function subjectLabel(key) {
  return LABELS[key] ?? key;
}

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   university: string,
 *   minPoints: number | null,
 *   subjectRequirements?: Record<string, string>,
 *   minPointsSource?: string,
 *   minPointsTier?: "guide_overall" | "institution_minimum" | "converted_official" | "manual",
 * }} Programme
 */

const UNKNOWN_ADMISSION_REASON =
  "Minimum points and subject rules are not listed in Thuto yet - confirm entry requirements with the institution.";

/**
 * True when we have a numeric min-points threshold for eligibility (stub catalogues use `null`).
 * @param {Programme | { minPoints?: number | null }} programme
 */
export function programmeHasAdmissionPoints(programme) {
  return typeof programme.minPoints === "number" && Number.isFinite(programme.minPoints);
}

// "Close" was a 2-4 BGCSE point gap. Expressed on the 0-100 index that is 4.17-8.33, so these
// bounds reproduce BGCSE behaviour exactly while giving every other scale a proportionate band.
const CLOSE_INDEX_MIN = 4;
const CLOSE_INDEX_MAX = 8.5;

/**
 * @param {Programme} programme
 * @param {Record<string, string>} gradesBySubject requirement-keyed bands (from rowsToRequirementGrades)
 * @param {number} [aggregateTotal] when using dynamic rows, pass total from computeBestSixBreakdown
 * @param {{ syllabusType?: string | null }} [options]
 * @returns {{
 *   status: 'Qualified' | 'Close' | 'Not eligible' | 'Unknown',
 *   reason: string | null,
 *   total: number,
 *   index: number,
 *   bgcseEquivalent: number,
 *   syllabusType: string,
 *   estimated: boolean,
 * }}
 */
export function evaluateProgramme(programme, gradesBySubject, aggregateTotal, options = {}) {
  const profile = getGradingProfile(options.syllabusType || DEFAULT_SYLLABUS);
  const total = aggregateTotal ?? computeBestSixTotal(gradesBySubject, profile.id);
  const index = attainmentIndex(total, profile);
  const bgcseEquivalent = indexToBgcsePoints(index);
  const base = {
    total,
    index,
    bgcseEquivalent,
    syllabusType: profile.id,
    // Non-BGCSE results go through a linear conversion, and unverified scales are guesses at
    // the scale itself. Both need the UI to soften how it states the outcome.
    estimated: profile.id !== DEFAULT_SYLLABUS || !profile.verified,
  };

  if (!programmeHasAdmissionPoints(programme)) {
    return { status: "Unknown", reason: UNKNOWN_ADMISSION_REASON, ...base };
  }

  const failures = [];
  for (const [key, req] of Object.entries(programme.subjectRequirements || {})) {
    const userG = gradesBySubject[key];
    if (!userG?.trim() || !meetsSubjectRequirement(userG, req)) {
      failures.push({
        key,
        required: req,
        actual: userG?.trim() ? userG.toUpperCase() : "-",
      });
    }
  }
  const subjOk = failures.length === 0;
  const minPts = /** @type {number} */ (programme.minPoints);
  const requiredIndex = requiredIndexFromMinPoints(minPts);
  const indexGap = requiredIndex - index;

  if (indexGap <= 0 && subjOk) {
    return { status: "Qualified", reason: null, ...base };
  }

  if (!subjOk) {
    const reason = failures
      .map((f) => `${subjectLabel(f.key)} needs at least ${f.required} (you have ${f.actual})`)
      .join("; ");
    return { status: "Not eligible", reason, ...base };
  }

  // Reason strings speak the student's own units, with the BGCSE threshold alongside so the
  // comparison against Thuto's catalogue is legible rather than mysterious.
  const shortfall =
    profile.id === DEFAULT_SYLLABUS
      ? `${Math.round(minPts - total)} points below the minimum (${minPts} pts required).`
      : `About ${Math.max(1, minPts - bgcseEquivalent)} points short — this programme needs ${minPts}/48 BGCSE-equivalent and your ${profile.aggregateLabel.toLowerCase()} of ${total} converts to about ${bgcseEquivalent}.`;

  if (indexGap >= CLOSE_INDEX_MIN && indexGap <= CLOSE_INDEX_MAX) {
    return { status: "Close", reason: shortfall, ...base };
  }

  return { status: "Not eligible", reason: shortfall, ...base };
}

/**
 * @param {Programme[]} programmes
 * @param {Record<string, string>} gradesBySubject
 * @param {number} [aggregateTotal]
 * @param {{ syllabusType?: string | null }} [options]
 */
export function evaluateAllProgrammes(programmes, gradesBySubject, aggregateTotal, options = {}) {
  return programmes.map((p) => ({
    programme: p,
    ...evaluateProgramme(p, gradesBySubject, aggregateTotal, options),
  }));
}

/** sessionStorage key: aggregate total for the Programmes "qualify on points" filter */
export const PREDICTOR_BEST_SIX_STORAGE_KEY = "thuto_predictor_best_six_total";

/** sessionStorage key: JSON object of requirement-key bands (from rowsToRequirementGrades) */
export const PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY = "thuto_predictor_requirement_grades";

/**
 * sessionStorage key: which syllabus the total belongs to. Without it a South African APS of 34
 * would be read as 34 BGCSE points by every page that consumes the snapshot.
 */
export const PREDICTOR_SYLLABUS_STORAGE_KEY = "thuto_predictor_syllabus";

/**
 * Read predictor snapshot from sessionStorage for programme detail / list qualify filter.
 * A snapshot written before the multi-syllabus change has no syllabus key and is BGCSE.
 *
 * @returns {{ total: number | null, grades: Record<string, string> | null, syllabusType: string }}
 */
export function readPredictorSession() {
  try {
    const totalRaw = sessionStorage.getItem(PREDICTOR_BEST_SIX_STORAGE_KEY);
    const gradesRaw = sessionStorage.getItem(PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY);
    const syllabusRaw = sessionStorage.getItem(PREDICTOR_SYLLABUS_STORAGE_KEY);
    const syllabusType = syllabusRaw && GRADING_PROFILE_IDS.has(syllabusRaw) ? syllabusRaw : DEFAULT_SYLLABUS;
    const total = totalRaw != null && totalRaw !== "" ? Number(totalRaw) : null;
    if (!Number.isFinite(total)) return { total: null, grades: null, syllabusType };

    if (gradesRaw == null || gradesRaw === "") {
      return { total, grades: null, syllabusType };
    }
    const parsed = JSON.parse(gradesRaw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { total, grades: null, syllabusType };
    }
    return { total, grades: /** @type {Record<string, string>} */ (parsed), syllabusType };
  } catch {
    return { total: null, grades: null, syllabusType: DEFAULT_SYLLABUS };
  }
}

/** Remove predictor snapshot (e.g. predictor Clear all). */
export function clearPredictorSession() {
  try {
    sessionStorage.removeItem(PREDICTOR_BEST_SIX_STORAGE_KEY);
    sessionStorage.removeItem(PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY);
    sessionStorage.removeItem(PREDICTOR_SYLLABUS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
