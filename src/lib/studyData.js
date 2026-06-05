import {
  evaluateProgramme,
  gradeToPoints,
  meetsSubjectRequirement,
  readPredictorSession,
  SUBJECT_FIELDS,
} from "./admissions.js";
import { BGCSE_SUBJECTS, SUBJECTS_BY_ID } from "./bgcseSubjects.js";

const STUDY_PATH = `${import.meta.env.BASE_URL}data/study.json`;

/** @param {string} path */
function withCacheBuster(path, cacheBuster) {
  if (cacheBuster == null || cacheBuster === "") return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}d=${encodeURIComponent(String(cacheBuster))}`;
}

const SUBJECT_LABELS = Object.fromEntries(SUBJECT_FIELDS.map(({ key, label }) => [key, label]));

/** First BGCSE subject id for each requirement key (for /study/:id links). */
const REQUIREMENT_KEY_TO_SUBJECT_ID = Object.fromEntries(
  BGCSE_SUBJECTS.filter((s) => s.requirementKey).map((s) => [s.requirementKey, s.id]),
);

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description: string,
 *   url: string,
 *   badge?: string,
 * }} StudyFeaturedSection
 */

/**
 * @typedef {{
 *   title: string,
 *   url: string,
 *   type?: string,
 * }} StudyResource
 */

/**
 * @typedef {{
 *   id: string,
 *   bgcseSubjectId: string,
 *   learningPassport?: { label: string, url: string },
 *   resources?: StudyResource[],
 *   revisionTips?: string[],
 * }} StudySubjectEntry
 */

/**
 * @typedef {{
 *   featuredSections: StudyFeaturedSection[],
 *   subjects: StudySubjectEntry[],
 * }} StudyCatalog
 */

/** @param {{ signal?: AbortSignal, cacheBuster?: string }} [options] */
export async function fetchStudy(options = {}) {
  const { signal, cacheBuster } = options;
  const url = withCacheBuster(STUDY_PATH, cacheBuster);
  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Could not load study resources");
  const data = await response.json();
  return /** @type {StudyCatalog} */ ({
    featuredSections: Array.isArray(data.featuredSections) ? data.featuredSections : [],
    subjects: Array.isArray(data.subjects) ? data.subjects : [],
  });
}

/** @param {StudyCatalog} catalog */
export function studySubjectsById(catalog) {
  return Object.fromEntries((catalog.subjects || []).map((entry) => [entry.id, entry]));
}

/**
 * @param {StudyCatalog} catalog
 * @param {string} subjectId
 */
export function getStudySubject(catalog, subjectId) {
  const entry = studySubjectsById(catalog)[subjectId];
  if (!entry) return null;
  const meta = SUBJECTS_BY_ID[entry.bgcseSubjectId || entry.id];
  return {
    ...entry,
    label: meta?.label ?? entry.id,
    requirementKey: meta?.requirementKey ?? null,
    examBoards: meta?.examBoards ?? ["bgcse"],
  };
}

/**
 * Programmes whose subjectRequirements include the given requirement key.
 * @param {import("./admissions.js").Programme[]} programmes
 * @param {string | null | undefined} requirementKey
 */
export function programmesForRequirementKey(programmes, requirementKey) {
  if (!requirementKey) return [];
  return programmes.filter((p) => {
    const req = p.subjectRequirements?.[requirementKey];
    return req != null && String(req).trim() !== "";
  });
}

/**
 * Programmes the user could newly qualify for if a requirement grade improved one step.
 * @param {import("./admissions.js").Programme[]} programmes
 * @param {string} requirementKey
 * @param {string} userGrade
 * @param {number} bestSixTotal
 */
export function countProgrammesUnlockedByGradeBump(programmes, requirementKey, userGrade, bestSixTotal) {
  const order = ["U", "G", "F", "E", "D", "C", "B", "A", "A*"];
  const idx = order.indexOf(String(userGrade).trim().toUpperCase());
  if (idx < 0 || idx >= order.length - 1) return 0;
  const bumpedGrade = order[idx + 1];
  let count = 0;
  for (const programme of programmes) {
    const req = programme.subjectRequirements?.[requirementKey];
    if (!req) continue;
    const before = evaluateProgramme(programme, { [requirementKey]: userGrade }, bestSixTotal);
    const after = evaluateProgramme(programme, { [requirementKey]: bumpedGrade }, bestSixTotal);
    if (before.status !== "Qualified" && after.status === "Qualified") count += 1;
  }
  return count;
}

/**
 * Subjects to focus on based on saved predictor grades and programme gates.
 * @param {import("./admissions.js").Programme[]} programmes
 * @param {{ grades: Record<string, string> | null, total: number | null }} [predictorSnap]
 */
export function computeFocusSubjects(programmes, predictorSnap = readPredictorSession()) {
  const { grades, total } = predictorSnap || {};
  if (!grades || total == null || !Number.isFinite(total)) return [];

  const rows = [];
  for (const [requirementKey, userGrade] of Object.entries(grades)) {
    if (!userGrade?.trim()) continue;
    const related = programmesForRequirementKey(programmes, requirementKey);
    if (!related.length) continue;

    let failing = 0;
    for (const programme of related) {
      const req = programme.subjectRequirements?.[requirementKey];
      if (req && !meetsSubjectRequirement(userGrade, req)) failing += 1;
    }

    const unlockCount = countProgrammesUnlockedByGradeBump(programmes, requirementKey, userGrade, total);
    const studySubjectId = REQUIREMENT_KEY_TO_SUBJECT_ID[requirementKey] ?? null;

    rows.push({
      requirementKey,
      label: SUBJECT_LABELS[requirementKey] ?? requirementKey,
      grade: userGrade.toUpperCase(),
      points: gradeToPoints(userGrade) ?? 0,
      gatedProgrammeCount: failing,
      unlockCount,
      studySubjectId,
    });
  }

  return rows
    .filter((row) => row.gatedProgrammeCount > 0 || row.unlockCount > 0)
    .sort(
      (a, b) =>
        b.gatedProgrammeCount - a.gatedProgrammeCount ||
        b.unlockCount - a.unlockCount ||
        a.points - b.points,
    )
    .slice(0, 3);
}

/** @param {string} query */
export function filterStudySubjects(subjects, query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return subjects;
  return subjects.filter((entry) => {
    const meta = SUBJECTS_BY_ID[entry.bgcseSubjectId || entry.id];
    const haystack = [entry.id, meta?.label, ...(meta?.aliases || [])].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

export { readPredictorSession };
