/** @typedef {'bgcse' | 'igcse' | 'as_level' | 'o_level'} SyllabusType */

export const SYLLABUS_OPTIONS = [
  { value: "bgcse", label: "BGCSE" },
  { value: "igcse", label: "IGCSE" },
  { value: "as_level", label: "AS Level" },
  { value: "o_level", label: "O-Level" },
];

export const SPONSORSHIP_INTENT_OPTIONS = [
  { value: "dtef", label: "DTEF (Government) Sponsorship" },
  { value: "private", label: "Private / Corporate Funding" },
  { value: "self_funded", label: "Self-Funded" },
];

/**
 * Map syllabus types to exam board tags used in subject catalog.
 * @param {string | null | undefined} syllabusType
 * @returns {string[]}
 */
export function examBoardsForSyllabus(syllabusType) {
  if (syllabusType === "bgcse") return ["bgcse"];
  if (syllabusType === "igcse" || syllabusType === "as_level" || syllabusType === "o_level") {
    return ["igcse"];
  }
  return ["bgcse", "igcse"];
}

/**
 * @param {string | null | undefined} syllabusType
 * @param {Array<{ id: string, label: string, examBoards?: string[] }>} subjects
 */
export function filterSubjectsBySyllabus(syllabusType, subjects) {
  const boards = new Set(examBoardsForSyllabus(syllabusType));
  if (!syllabusType) return subjects;
  return subjects.filter((subject) => (subject.examBoards || []).some((board) => boards.has(board)));
}

/**
 * @param {string | null | undefined} syllabusType
 */
export function canUsePredictor(syllabusType) {
  return Boolean(syllabusType && SYLLABUS_OPTIONS.some((option) => option.value === syllabusType));
}
