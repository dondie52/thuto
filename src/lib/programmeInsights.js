import { SUBJECT_FIELDS, programmeHasAdmissionPoints } from "./admissions.js";

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
  return unique(programme.careerOpportunities?.length ? programme.careerOpportunities : programme.careers);
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

