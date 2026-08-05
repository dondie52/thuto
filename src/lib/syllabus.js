/** @typedef {import("./gradingSystems.js").GradingProfile} GradingProfile */

import {
  ALL_SYLLABUS_VALUES,
  defaultSyllabusForCountry,
  getGradingProfile,
  syllabusOptionsForCountry,
} from "./gradingSystems.js";
import { ALL_SPONSORSHIP_VALUES, sponsorshipOptionsForCountry } from "./marketLocales.js";
import { DEFAULT_MARKET_COUNTRY, resolveMarketCountry } from "./marketCountry.js";

/**
 * A grading profile id. There are ~27 of them across African exam systems, so this is a plain
 * string rather than a union — see `GRADING_PROFILES` in `./gradingSystems.js` for the registry.
 * @typedef {string} SyllabusType
 */

/** @deprecated Prefer syllabusOptionsForCountry(country) */
export const SYLLABUS_OPTIONS = syllabusOptionsForCountry("bw");

/** @deprecated Prefer sponsorshipOptionsForCountry(country) */
export const SPONSORSHIP_INTENT_OPTIONS = sponsorshipOptionsForCountry("bw");

export {
  ALL_SYLLABUS_VALUES,
  ALL_SPONSORSHIP_VALUES,
  defaultSyllabusForCountry,
  getGradingProfile,
  syllabusOptionsForCountry,
  sponsorshipOptionsForCountry,
};

/**
 * Map syllabus types to exam board tags used in subject catalog.
 * @param {string | null | undefined} syllabusType
 * @returns {string[]}
 */
export function examBoardsForSyllabus(syllabusType) {
  if (!syllabusType) return ["bgcse", "igcse"];
  return getGradingProfile(syllabusType).examBoards;
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
  return Boolean(syllabusType && ALL_SYLLABUS_VALUES.includes(String(syllabusType)));
}

/**
 * @param {string | null | undefined} sponsorshipIntent
 */
export function isValidSponsorshipIntent(sponsorshipIntent) {
  return ALL_SPONSORSHIP_VALUES.includes(String(sponsorshipIntent || ""));
}

/**
 * Drop sponsorship values that don't belong to the selected country.
 * @param {string | null | undefined} sponsorshipIntent
 * @param {string | null | undefined} country
 */
export function normalizeSponsorshipForCountry(sponsorshipIntent, country) {
  const options = sponsorshipOptionsForCountry(country || resolveMarketCountry() || DEFAULT_MARKET_COUNTRY);
  if (options.some((o) => o.value === sponsorshipIntent)) return sponsorshipIntent;
  return null;
}
