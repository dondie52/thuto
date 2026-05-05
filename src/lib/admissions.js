import { BGCSE_SUBJECT_BY_ID } from "./bgcseSubjects.js";

/**
 * Official Botswana BGCSE grade points for admission scoring.
 * Best-six maximum total = 48 (six A grades at 8 points each).
 * A* counts the same as A under UB/BIUST admissions guides.
 */
export const GRADE_POINTS = {
  "A*": 8,
  A: 8,
  B: 7,
  C: 6,
  D: 5,
  E: 4,
  F: 3,
  G: 2,
  U: 0,
};

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
 * @returns {number | null}
 */
export function gradeToPoints(grade) {
  if (grade == null || String(grade).trim() === "") return null;
  const g = String(grade).trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(GRADE_POINTS, g) ? GRADE_POINTS[g] : null;
}

/**
 * Sum of the best six subject points from entered grades (fewer than six subjects → sum all entered).
 * @param {Record<string, string>} gradesBySubject
 */
export function computeBestSixTotal(gradesBySubject) {
  const pointsList = [];
  for (const grade of Object.values(gradesBySubject)) {
    const p = gradeToPoints(grade);
    if (p != null) pointsList.push(p);
  }
  pointsList.sort((a, b) => b - a);
  const top6 = pointsList.slice(0, 6);
  return top6.reduce((sum, p) => sum + p, 0);
}

/**
 * @typedef {{ subjectId: string, grade: string }} GradeRow
 * @typedef {{ subjectId: string, label: string, grade: string, points: number }} CountedEntry
 */

/**
 * Best-six breakdown from distinct subject rows (one grade per BGCSE subject).
 * @param {GradeRow[]} rows
 * @returns {{ total: number, counted: CountedEntry[], dropped: CountedEntry[], invalid: string | null }}
 */
export function computeBestSixBreakdown(rows) {
  const scored = [];
  for (const row of rows) {
    const g = row.grade?.trim();
    if (!g) continue;
    const p = gradeToPoints(g);
    if (p == null) {
      const meta = BGCSE_SUBJECT_BY_ID[row.subjectId];
      return {
        total: 0,
        counted: [],
        dropped: [],
        invalid: `Invalid grade for ${meta?.label ?? row.subjectId}. Use A*, A–G, or U.`,
      };
    }
    const meta = BGCSE_SUBJECT_BY_ID[row.subjectId];
    if (!meta) {
      return { total: 0, counted: [], dropped: [], invalid: "Unknown subject in row." };
    }
    scored.push({
      subjectId: row.subjectId,
      label: meta.label,
      grade: g.toUpperCase(),
      points: p,
    });
  }
  if (scored.length === 0) {
    return { total: 0, counted: [], dropped: [], invalid: null };
  }
  const sorted = [...scored].sort((a, b) => b.points - a.points || a.label.localeCompare(b.label));
  const counted = sorted.slice(0, 6);
  const dropped = sorted.slice(6);
  const total = counted.reduce((s, e) => s + e.points, 0);
  return { total, counted, dropped, invalid: null };
}

/**
 * Fold predictor rows into requirement keys for programme.json checks.
 * When several rows map to the same key (e.g. Biology + Physics → science), keep the best grade.
 * @param {GradeRow[]} rows
 * @returns {Record<string, string>}
 */
export function rowsToRequirementGrades(rows) {
  /** @type {Record<string, { grade: string, points: number }>} */
  const best = {};
  for (const row of rows) {
    const g = row.grade?.trim();
    if (!g) continue;
    const pts = gradeToPoints(g);
    if (pts == null) continue;
    const meta = BGCSE_SUBJECT_BY_ID[row.subjectId];
    if (!meta?.requirementKey) continue;
    const k = meta.requirementKey;
    if (best[k] == null || pts > best[k].points) {
      best[k] = { grade: g.toUpperCase(), points: pts };
    }
  }
  return Object.fromEntries(Object.entries(best).map(([k, v]) => [k, v.grade]));
}

/**
 * User meets requirement if their grade is the same or better (e.g. B satisfies "C").
 */
export function meetsSubjectRequirement(userGrade, requiredGrade) {
  const u = gradeToPoints(userGrade);
  const r = gradeToPoints(requiredGrade);
  if (u == null || r == null) return false;
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

/**
 * @param {Programme} programme
 * @param {Record<string, string>} gradesBySubject requirement-keyed grades (from rowsToRequirementGrades)
 * @param {number} [bestSixTotal] when using dynamic rows, pass total from computeBestSixBreakdown
 * @returns {{ status: 'Qualified' | 'Close' | 'Not eligible' | 'Unknown', reason: string | null, total: number }}
 */
export function evaluateProgramme(programme, gradesBySubject, bestSixTotal) {
  const total = bestSixTotal ?? computeBestSixTotal(gradesBySubject);

  if (!programmeHasAdmissionPoints(programme)) {
    return { status: "Unknown", reason: UNKNOWN_ADMISSION_REASON, total };
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
  const pointsOk = total >= minPts;
  const gap = minPts - total;

  if (pointsOk && subjOk) {
    return { status: "Qualified", reason: null, total };
  }

  if (!subjOk) {
    const reason = failures
      .map((f) => `${subjectLabel(f.key)} needs at least ${f.required} (you have ${f.actual})`)
      .join("; ");
    return { status: "Not eligible", reason, total };
  }

  if (gap >= 2 && gap <= 4) {
    return {
      status: "Close",
      reason: `${gap} points below the minimum (${minPts} pts required).`,
      total,
    };
  }

  return {
    status: "Not eligible",
    reason:
      gap > 4
        ? `${gap} points below the minimum (${minPts} pts required).`
        : `Need at least ${minPts} points (you have ${total}).`,
    total,
  };
}

/**
 * @param {Programme[]} programmes
 * @param {Record<string, string>} gradesBySubject
 * @param {number} [bestSixTotal]
 */
export function evaluateAllProgrammes(programmes, gradesBySubject, bestSixTotal) {
  return programmes.map((p) => ({
    programme: p,
    ...evaluateProgramme(p, gradesBySubject, bestSixTotal),
  }));
}

/** sessionStorage key: best-six total for Programmes "qualify on points" filter */
export const PREDICTOR_BEST_SIX_STORAGE_KEY = "thuto_predictor_best_six_total";

/** sessionStorage key: JSON object of requirement-key grades (from rowsToRequirementGrades) */
export const PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY = "thuto_predictor_requirement_grades";

/**
 * Read predictor snapshot from sessionStorage for programme detail / list qualify filter.
 * @returns {{ total: number | null, grades: Record<string, string> | null }}
 */
export function readPredictorSession() {
  try {
    const totalRaw = sessionStorage.getItem(PREDICTOR_BEST_SIX_STORAGE_KEY);
    const gradesRaw = sessionStorage.getItem(PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY);
    const total = totalRaw != null && totalRaw !== "" ? Number(totalRaw) : null;
    if (!Number.isFinite(total)) return { total: null, grades: null };

    if (gradesRaw == null || gradesRaw === "") {
      return { total, grades: null };
    }
    const parsed = JSON.parse(gradesRaw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { total, grades: null };
    }
    return { total, grades: /** @type {Record<string, string>} */ (parsed) };
  } catch {
    return { total: null, grades: null };
  }
}

/** Remove predictor snapshot (e.g. predictor Clear all). */
export function clearPredictorSession() {
  try {
    sessionStorage.removeItem(PREDICTOR_BEST_SIX_STORAGE_KEY);
    sessionStorage.removeItem(PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
