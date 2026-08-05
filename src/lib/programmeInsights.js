import { SUBJECT_FIELDS, programmeHasAdmissionPoints } from "./admissions.js";

const GENERIC_DESCRIPTION_PATTERNS = [
  /^Programme at .+ Confirm entry requirements/i,
  /^Programme at .+ Admission points are taken/i,
  /^Programme at .+ Entry requirements are based/i,
  /^Programme at .+ Teaching is blended/i,
  /^From BCET \d/i,
];

export function isGenericProgrammeDescription(description) {
  const text = String(description || "").trim();
  if (!text) return true;
  return GENERIC_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(text));
}

/** Campus or main study location; falls back to the institution's primary location. */
export function getProgrammeCampusLocation(programme, universityLocation) {
  const campus = String(programme?.campus || "").trim();
  if (campus) return campus;

  const studyMode = String(programme?.studyMode || "").toLowerCase();
  if (studyMode.includes("distance") || studyMode.includes("open") || studyMode.includes("online")) {
    return "Distance / online";
  }

  const location = String(universityLocation || "").trim();
  if (location) return location;

  return "Confirm with institution";
}

/** Short programme overview (~3 lines) for the detail header; uses curated copy when available. */
export function getProgrammeAboutSummary(programme) {
  const curated = String(programme?.description || "").trim();
  if (curated && !isGenericProgrammeDescription(curated)) {
    return curated;
  }

  const name = programme?.name || "This programme";
  const university = programme?.university || "the institution";
  const field = programme?.field;
  const duration = programme?.duration;
  const careers = getProgrammeCareers(programme);
  const lines = [];

  lines.push(
    field
      ? `${name} at ${university} is a ${field.toLowerCase()} qualification.`
      : `${name} is offered at ${university}.`,
  );

  if (duration) {
    lines.push(`It typically runs for ${duration}.`);
  } else if (programme?.studyMode) {
    lines.push(`Study mode: ${programme.studyMode}.`);
  }

  if (programmeHasAdmissionPoints(programme)) {
    lines.push(`Applicants usually need at least ${programme.minPoints} BGCSE points (best six).`);
  } else if (careers.length) {
    lines.push(`Graduates often move into roles such as ${careers.slice(0, 3).join(", ")}.`);
  } else {
    lines.push(`Confirm entry requirements and campus details with ${university} before you apply.`);
  }

  return lines.slice(0, 3).join(" ");
}

const SUBJECT_LABELS = Object.fromEntries(SUBJECT_FIELDS.map(({ key, label }) => [key, label]));

function unique(values) {
  return [...new Set((values || []).filter(Boolean).map(String))];
}

function wordsFromText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 3);
}

export function getProgrammeInterests(programme) {
  if (programme.interests?.length) return unique(programme.interests);
  const fromTags = programme.tags?.slice(0, 4) || [];
  if (fromTags.length) return unique(fromTags);
  const fallback = [programme.field, programme.faculty].filter(Boolean);
  return unique(fallback);
}

export function getProgrammeCareers(programme) {
  return unique([
    ...(programme.careerOpportunities?.length ? programme.careerOpportunities : programme.careers || []),
    ...(programme.jobOpportunities || []),
  ]);
}

/**
 * Programme-level accreditation is rarely populated, so the institution's own accreditation
 * record is used as the fallback — a programme at an accredited institution is the common case,
 * and the header needs something truthful to show.
 *
 * @param {Record<string, unknown> | null | undefined} programme
 * @param {Record<string, unknown> | null | undefined} [university]
 */
export function getProgrammeAccreditation(programme, university = null) {
  const text = (value) => String(value || "").trim();
  const status = text(programme?.accreditationStatus) || text(university?.accreditationStatus);
  return {
    status,
    body: text(programme?.accreditationBody) || text(university?.accreditationBody),
    notes: text(programme?.accreditationNotes) || text(university?.accreditationNotes),
    sourceUrl: text(programme?.accreditationSourceUrl) || text(university?.accreditationSourceUrl),
  };
}

export function getProgrammeRelatedSubjects(programme) {
  if (programme.relatedSubjects?.length) return unique(programme.relatedSubjects);
  return unique(Object.keys(programme.subjectRequirements || {}).map((key) => SUBJECT_LABELS[key] || key));
}

export function isFitFinderCompatible(programme) {
  return Boolean(
    programmeHasAdmissionPoints(programme) ||
      programme.field ||
      programme.description ||
      programme.careers?.length ||
      programme.careerOpportunities?.length ||
      programme.modules?.length,
  );
}

export function getSimilarProgrammes(programme, allProgrammes, limit = 3) {
  if (!programme) return [];
  const baseWords = new Set([
    ...wordsFromText(programme.name),
    ...wordsFromText(programme.field),
    ...(programme.tags || []).flatMap(wordsFromText),
    ...(programme.interests || []).flatMap(wordsFromText),
  ]);
  const scored = allProgrammes
    .filter((p) => p.id !== programme.id)
    .map((p) => {
      let score = 0;
      if (p.field && programme.field && p.field === programme.field) score += 6;
      if (p.university && programme.university && p.university === programme.university) score += 2;
      for (const word of wordsFromText([p.name, p.field, ...(p.tags || []), ...(p.interests || [])].join(" "))) {
        if (baseWords.has(word)) score += 1;
      }
      return { programme: p, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.programme.name.localeCompare(b.programme.name));
  return scored.slice(0, limit).map((row) => row.programme);
}

