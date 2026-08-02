import { categorizeUniversity, UNIVERSITY_CATEGORY_META } from "./universitiesData.js";

export const UNIVERSITY_SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "x", label: "X" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
];

function normalizeText(value) {
  return String(value || "").trim();
}

function uniqueStrings(values) {
  return [...new Set((values || []).map(normalizeText).filter(Boolean))];
}

export function splitMultilineList(value) {
  return uniqueStrings(
    String(value || "")
      .split(/\n|,/)
      .map((item) => item.trim()),
  );
}

export function normalizeUniversityContacts(university) {
  return {
    address: normalizeText(university?.physicalAddress || university?.address),
    generalPhone: normalizeText(university?.generalPhone || university?.phone),
    admissionsPhone: normalizeText(university?.admissionsPhone),
    generalEmail: normalizeText(university?.generalEmail || university?.email),
    admissionsEmail: normalizeText(university?.admissionsEmail),
  };
}

export function normalizeUniversitySocialLinks(university) {
  const source = university?.socialLinks && typeof university.socialLinks === "object" ? university.socialLinks : {};
  return Object.fromEntries(
    UNIVERSITY_SOCIAL_PLATFORMS.map(({ key }) => [key, normalizeText(source[key] || university?.[`${key}Url`])]),
  );
}

export function normalizeUniversityCampusPhotos(university) {
  const list = Array.isArray(university?.campusPhotos) ? university.campusPhotos : [];
  const fallback = normalizeText(university?.campusPhoto || university?.campusImage);
  return uniqueStrings([...list, fallback]);
}

export const ACCREDITATION_ON = "Accredited";
export const ACCREDITATION_OFF = "Not accredited";
export const ACCOMMODATION_ON = "Available";
export const ACCOMMODATION_OFF = "Unavailable";
export const APPLICATION_WINDOW_OPEN = "open";
export const APPLICATION_WINDOW_CLOSED = "closed";

const NEGATIVE_STATUS = /^(no|not|un|non|false|closed|unavailable|pending)\b/i;

/**
 * Read a legacy free-text status ("Fully accredited by BQA", "Not accredited") as a
 * yes/no answer so the CMS toggles hydrate from values saved before they existed.
 * @param {unknown} value
 */
export function isAffirmativeStatus(value) {
  const text = normalizeText(value);
  if (!text) return false;
  return !NEGATIVE_STATUS.test(text);
}

/**
 * Applications are treated as open unless an institution explicitly closed them, so
 * the bundled catalogue keeps its current behaviour.
 * @param {unknown} value
 */
export function isApplicationWindowOpen(value) {
  return normalizeText(value).toLowerCase() !== APPLICATION_WINDOW_CLOSED;
}

export function normalizeUniversityFaculties(university) {
  return uniqueStrings(Array.isArray(university?.faculties) ? university.faculties : []);
}

export function normalizeUniversityAccreditation(university) {
  return {
    status: normalizeText(university?.accreditationStatus),
  };
}

export function normalizeUniversityStudentLife(university) {
  return {
    accommodationStatus: normalizeText(university?.accommodationStatus),
    healthDetails: normalizeText(university?.healthDetails),
    safetyDetails: normalizeText(university?.safetyDetails),
    sportsDetails: normalizeText(university?.sportsDetails),
    careerSupportDetails: normalizeText(university?.careerSupportDetails),
  };
}

export function getUniversityTypeLabel(university) {
  const explicit = normalizeText(university?.universityType || university?.type);
  if (explicit) return explicit;
  const category = categorizeUniversity(university || {});
  return UNIVERSITY_CATEGORY_META[category]?.label || "Institution";
}

export function summarizeUniversityProfileCompleteness(university, programmeCount = 0) {
  const contacts = normalizeUniversityContacts(university);
  const accreditation = normalizeUniversityAccreditation(university);
  const socials = normalizeUniversitySocialLinks(university);
  const campusPhotos = normalizeUniversityCampusPhotos(university);
  const studentLife = normalizeUniversityStudentLife(university);
  const completed = [
    university?.description,
    university?.website,
    contacts.address,
    contacts.generalPhone || contacts.generalEmail,
    accreditation.status,
    Object.values(socials).some(Boolean),
    campusPhotos.length > 0,
    studentLife.accommodationStatus || studentLife.healthDetails || studentLife.safetyDetails || studentLife.sportsDetails,
    programmeCount > 0,
  ].filter(Boolean).length;

  return {
    completed,
    total: 9,
    ratio: completed / 9,
  };
}
