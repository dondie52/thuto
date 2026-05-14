import { BGCSE_SUBJECTS, BGCSE_SUBJECT_BY_ID } from "./bgcseSubjects.js";
import {
  SUBJECT_FIELDS,
  evaluateProgramme,
  gradeToPoints,
  meetsSubjectRequirement,
  programmeHasAdmissionPoints,
} from "./admissions.js";

/** Persisted finder answers so refresh on results keeps context. */
export const FIT_FINDER_ANSWERS_KEY = "thuto_fit_finder_answers_v2";

const SUBJECT_LABELS = Object.fromEntries(SUBJECT_FIELDS.map(({ key, label }) => [key, label]));

export const CAREER_AREA_OPTIONS = [
  { value: "", label: "Any career area" },
  { value: "technology", label: "Technology, data, and IT" },
  { value: "health", label: "Health and life sciences" },
  { value: "business", label: "Business, finance, and entrepreneurship" },
  { value: "engineering", label: "Engineering, trades, and built environment" },
  { value: "education", label: "Teaching and community work" },
  { value: "law_policy", label: "Law, policy, and public service" },
  { value: "creative", label: "Creative arts, design, and media" },
  { value: "hospitality", label: "Hospitality, tourism, and service" },
];

export const QUALIFICATION_LEVEL_OPTIONS = [
  { value: "", label: "Any qualification level" },
  { value: "certificate", label: "Certificate" },
  { value: "diploma", label: "Diploma" },
  { value: "degree", label: "Degree" },
  { value: "professional", label: "Professional / short course" },
];

export const STUDY_MODE_OPTIONS = [
  { value: "", label: "Any study mode" },
  { value: "full time", label: "Full time" },
  { value: "part time", label: "Part time / evening" },
  { value: "block release", label: "Block release" },
  { value: "online", label: "Online / distance" },
];

export const DEFAULT_FIT_PROFILE = {
  interests: "",
  careerArea: "",
  preferredInstitution: "",
  qualificationLevel: "",
  studyMode: "",
  strengths: "",
  avoidSubjects: [],
};

// Kept for older code/tests that imported the previous quiz constants.
export const DEFAULT_FIT_ANSWERS = {
  workStyle: "numbers_logic",
  subjectEnjoy: "math_science",
  careerCuriosity: "exploring",
  studyPace: "mix",
  afterSchool: "not_sure",
};

export const FIT_FINDER_QUESTIONS = [
  {
    id: "careerCuriosity",
    title: "Preferred career area",
    options: CAREER_AREA_OPTIONS.filter((o) => o.value).map((o) => ({ value: o.value, label: o.label })),
  },
];

const AREA_KEYWORDS = {
  technology: [
    "technology",
    "computer",
    "computing",
    "software",
    "data",
    "information",
    "it",
    "network",
    "programming",
    "systems",
    "cyber",
  ],
  health: [
    "health",
    "nursing",
    "medicine",
    "medical",
    "biology",
    "biomedical",
    "pharmacy",
    "laboratory",
    "clinical",
    "public health",
  ],
  business: [
    "business",
    "account",
    "finance",
    "commerce",
    "marketing",
    "entrepreneur",
    "management",
    "economics",
    "bank",
  ],
  engineering: [
    "engineering",
    "engineer",
    "construction",
    "built",
    "mechanical",
    "electrical",
    "mining",
    "design technology",
    "trade",
    "technical",
  ],
  education: ["education", "teaching", "teacher", "community", "early childhood", "social work", "training"],
  law_policy: ["law", "legal", "policy", "public administration", "governance", "government", "justice"],
  creative: ["creative", "design", "art", "media", "music", "film", "fashion", "graphics"],
  hospitality: ["hospitality", "tourism", "hotel", "travel", "culinary", "service"],
  natural_sciences: ["science", "chemistry", "physics", "mathematics", "statistics", "environment", "agriculture"],
  social_sciences: ["social", "psychology", "sociology", "humanities", "development", "history", "geography"],
};

const SUBJECT_AREA_MAP = {
  mathematics: ["technology", "engineering", "business", "natural_sciences"],
  math: ["technology", "engineering", "business", "natural_sciences"],
  physics: ["engineering", "technology", "natural_sciences"],
  chemistry: ["health", "engineering", "natural_sciences"],
  biology: ["health", "natural_sciences", "agriculture"],
  science: ["health", "engineering", "natural_sciences"],
  combined_science: ["health", "engineering", "natural_sciences"],
  science_double: ["health", "engineering", "natural_sciences"],
  science_single: ["health", "engineering", "natural_sciences"],
  computer_studies: ["technology"],
  business_studies: ["business"],
  accounting: ["business"],
  social_studies: ["education", "law_policy", "social_sciences"],
  history: ["education", "law_policy", "social_sciences"],
  geography: ["natural_sciences", "social_sciences", "education"],
  agriculture: ["natural_sciences", "business"],
  design_technology: ["engineering", "creative", "technology"],
  art: ["creative"],
  english: ["education", "law_policy", "social_sciences"],
  setswana: ["education", "social_sciences"],
  socialStudies: ["education", "law_policy", "social_sciences"],
  socialstudies: ["education", "law_policy", "social_sciences"],
  businessStudies: ["business"],
  businessstudies: ["business"],
  development_studies: ["social_sciences", "law_policy"],
  home_management: ["hospitality", "health"],
  physical_education: ["health", "education"],
  music: ["creative", "education"],
  religious_education: ["education", "social_sciences"],
  french: ["education", "hospitality", "social_sciences"],
};

export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value == null || value === "") return [];
  return String(value)
    .split(/[,;\n]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function programmeTokens(programme) {
  const modules = (programme.modules || [])
    .flatMap((block) => block?.modules || [])
    .join(" ");
  return normalizeText(
    [
      programme.name,
      programme.field,
      programme.faculty,
      programme.description,
      (programme.careers || []).join(" "),
      (programme.careerOpportunities || []).join(" "),
      (programme.interests || []).join(" "),
      (programme.relatedSubjects || []).join(" "),
      (programme.tags || []).join(" "),
      modules,
    ].join(" "),
  );
}

function textMatchesAny(text, words) {
  const haystack = normalizeText(text);
  return words.some((word) => haystack.includes(normalizeText(word)));
}

function detectAreaFromProgramme(programme) {
  const text = programmeTokens(programme);
  const matches = [];
  for (const [area, words] of Object.entries(AREA_KEYWORDS)) {
    if (words.some((w) => text.includes(normalizeText(w)))) matches.push(area);
  }
  return matches;
}

export function detectInterestArea(input) {
  const text = normalizeText(Array.isArray(input) ? input.join(" ") : input);
  if (!text) return [];
  const direct = CAREER_AREA_OPTIONS.find((o) => o.value && normalizeText(o.value) === text);
  if (direct) return [direct.value];
  const matches = [];
  for (const [area, words] of Object.entries(AREA_KEYWORDS)) {
    if (words.some((w) => text.includes(normalizeText(w)))) matches.push(area);
  }
  return matches;
}

export function mapSubjectsToFields(subjects) {
  const ids = Array.isArray(subjects)
    ? subjects
    : Object.keys(subjects || {});
  const out = new Set();
  for (const raw of ids) {
    const key = normalizeText(raw).replace(/\s+/g, "_");
    const subject =
      BGCSE_SUBJECT_BY_ID[key] ||
      BGCSE_SUBJECTS.find((s) => normalizeText(s.label) === normalizeText(raw));
    const mapped = SUBJECT_AREA_MAP[subject?.id || key] || [];
    mapped.forEach((area) => out.add(area));
  }
  return [...out];
}

export function getAdmissionCompatibility(programme, profile = {}) {
  const total = Number.isFinite(profile.bestSixTotal) ? profile.bestSixTotal : undefined;
  const grades = profile.requirementGrades || {};
  return evaluateProgramme(programme, grades, total);
}

function inferQualificationLevel(programme) {
  const explicit = normalizeText(programme.qualification);
  const text = normalizeText(programme.name);
  const combined = `${explicit} ${text}`;
  if (combined.includes("certificate")) return "certificate";
  if (combined.includes("diploma")) return "diploma";
  if (combined.includes("degree") || combined.includes("bachelor") || /\bba\b|\bbsc\b|\bbeng\b|\bbcom\b/.test(combined)) {
    return "degree";
  }
  if (combined.includes("professional") || combined.includes("short course")) return "professional";
  return "";
}

function helpfulSubjects(programme) {
  if (Array.isArray(programme.relatedSubjects) && programme.relatedSubjects.length) {
    return programme.relatedSubjects;
  }
  const reqs = Object.keys(programme.subjectRequirements || {});
  return reqs.map((key) => SUBJECT_LABELS[key] || key);
}

export function explainFit(programme, profile = {}, details = null) {
  const reasons = [];
  const concerns = [];
  const nextSteps = [];
  const admission = details?.admission || getAdmissionCompatibility(programme, profile);

  const interests = toList(profile.interests);
  if (interests.length && textMatchesAny(programmeTokens(programme), interests)) {
    reasons.push("Your stated interests appear in this programme profile.");
  }

  const selectedAreas = [
    ...detectInterestArea(profile.careerArea),
    ...detectInterestArea(profile.interests),
    ...detectInterestArea(profile.strengths),
  ];
  const programmeAreas = detectAreaFromProgramme(programme);
  const areaHit = selectedAreas.find((area) => programmeAreas.includes(area));
  if (areaHit) {
    reasons.push(`It aligns with your ${areaHit.replace("_", " ")} direction.`);
  }

  const subjects = helpfulSubjects(programme);
  if (subjects.length) {
    reasons.push(`Useful subjects for this route include ${subjects.slice(0, 3).join(", ")}.`);
  }

  if (profile.preferredInstitution && normalizeText(programme.university).includes(normalizeText(profile.preferredInstitution))) {
    reasons.push("It matches your preferred institution.");
  }

  if (programme.careers?.length || programme.careerOpportunities?.length) {
    const careers = programme.careerOpportunities?.length ? programme.careerOpportunities : programme.careers;
    reasons.push(`Related careers listed in Thuto include ${careers.slice(0, 3).join(", ")}.`);
  } else {
    concerns.push("Career examples are not listed in Thuto yet for this programme.");
  }

  if (admission.status === "Qualified") {
    reasons.push("Your saved grades meet the sample admission check.");
  } else if (admission.status === "Close") {
    concerns.push(admission.reason || "You are close on the sample points check.");
  } else if (admission.status === "Not eligible") {
    concerns.push(admission.reason || "Your saved grades do not meet the sample admission check.");
  } else {
    concerns.push("Admission points or subject rules are missing in Thuto, so eligibility cannot be confirmed locally.");
  }

  const avoidSubjects = toList(profile.avoidSubjects);
  if (avoidSubjects.length && textMatchesAny(programmeTokens(programme), avoidSubjects)) {
    concerns.push("It may include a subject area you said you want to avoid.");
  }

  if (programme.applyUrl) {
    nextSteps.push("Open the application link and confirm the latest official requirements.");
  } else if (programme.officialUrl) {
    nextSteps.push("Open the official programme page and confirm admissions details.");
  } else {
    nextSteps.push("Contact the institution to confirm application steps and requirements.");
  }
  nextSteps.push("Compare it with at least two similar programmes before deciding.");
  if (admission.status !== "Qualified") nextSteps.push("Ask the admissions office about bridging, upgrading, or alternative routes.");

  return { reasons, concerns, nextSteps };
}

export function scoreProgrammeFit(programme, profile = {}) {
  let score = 35;
  const matched = {
    interest: false,
    careerArea: false,
    subjects: false,
    institution: false,
    qualification: false,
    studyMode: false,
  };

  const text = programmeTokens(programme);
  const admission = getAdmissionCompatibility(programme, profile);

  const interests = toList(profile.interests);
  if (interests.length) {
    const hits = interests.filter((interest) => text.includes(normalizeText(interest))).length;
    if (hits) {
      score += Math.min(18, 8 + hits * 4);
      matched.interest = true;
    }
  }

  const selectedAreas = [
    ...detectInterestArea(profile.careerArea),
    ...detectInterestArea(profile.interests),
    ...detectInterestArea(profile.strengths),
  ];
  const subjectAreas = mapSubjectsToFields(profile.subjectIds || Object.keys(profile.requirementGrades || {}));
  const programmeAreas = detectAreaFromProgramme(programme);
  const areaOverlap = [...new Set([...selectedAreas, ...subjectAreas])].filter((area) => programmeAreas.includes(area));
  if (areaOverlap.length) {
    score += Math.min(24, 10 + areaOverlap.length * 5);
    matched.careerArea = true;
  }

  const reqs = programme.subjectRequirements || {};
  let metReqs = 0;
  let knownReqs = 0;
  for (const [key, requiredGrade] of Object.entries(reqs)) {
    const userGrade = profile.requirementGrades?.[key];
    if (!userGrade) continue;
    knownReqs += 1;
    if (meetsSubjectRequirement(userGrade, requiredGrade)) metReqs += 1;
  }
  if (knownReqs > 0) {
    score += Math.round((metReqs / knownReqs) * 12);
    matched.subjects = metReqs > 0;
  }

  if (profile.preferredInstitution && normalizeText(programme.university).includes(normalizeText(profile.preferredInstitution))) {
    score += 8;
    matched.institution = true;
  }

  const wantedLevel = normalizeText(profile.qualificationLevel);
  const programmeLevel = inferQualificationLevel(programme);
  if (wantedLevel && programmeLevel && programmeLevel === wantedLevel) {
    score += 5;
    matched.qualification = true;
  }

  const wantedMode = normalizeText(profile.studyMode);
  const programmeMode = normalizeText(programme.studyMode);
  if (wantedMode && programmeMode && programmeMode.includes(wantedMode)) {
    score += 5;
    matched.studyMode = true;
  }

  const strengths = toList(profile.strengths);
  if (strengths.length && textMatchesAny(text, strengths)) score += 8;

  const avoidSubjects = toList(profile.avoidSubjects);
  if (avoidSubjects.length && textMatchesAny(text, avoidSubjects)) score -= 18;

  if (admission.status === "Qualified") score += 12;
  else if (admission.status === "Close") score += 4;
  else if (admission.status === "Not eligible") score -= 12;

  const fitScore = Math.max(0, Math.min(100, Math.round(score)));
  const explanation = explainFit(programme, profile, { admission, matched });

  return {
    programme,
    fitScore,
    score: fitScore,
    admission,
    matched,
    matchedInstitution: programme.university || "Institution not listed",
    applyLink: programme.applyUrl || programme.officialUrl || "",
    why: explanation.reasons,
    concerns: explanation.concerns,
    nextSteps: explanation.nextSteps,
  };
}

export function rankProgrammeMatches(programmes, profile = {}, options = {}) {
  const limit = options.limit ?? programmes.length;
  return programmes
    .map((programme) => scoreProgrammeFit(programme, profile))
    .sort((a, b) => {
      if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
      const admissionRank = { Qualified: 0, Close: 1, Unknown: 2, "Not eligible": 3 };
      const ar = (admissionRank[a.admission.status] ?? 4) - (admissionRank[b.admission.status] ?? 4);
      if (ar !== 0) return ar;
      return String(a.programme.name).localeCompare(String(b.programme.name));
    })
    .slice(0, limit);
}

export function buildProgrammeFitExplanation(match) {
  if (!match) return "No fit result is available.";
  const why = match.why?.[0] || "This programme shares signals with your profile.";
  const concern = match.concerns?.[0] ? ` Concern: ${match.concerns[0]}` : "";
  return `${match.fitScore}% fit. ${why}${concern}`;
}

function oldAnswersToProfile(answers) {
  const a = { ...DEFAULT_FIT_ANSWERS, ...(answers || {}) };
  const careerMap = {
    tech_computing: "technology",
    health_science: "health",
    business_money: "business",
    law_policy: "law_policy",
    engineering_build: "engineering",
    teach_community: "education",
    exploring: "",
  };
  const subjectMap = {
    math_science: "mathematics, science, computer studies",
    languages_writing: "english, setswana, writing",
    business_economics: "business, accounting, economics",
    arts_design: "art, design, media",
    social_people: "social studies, community",
  };
  return {
    ...DEFAULT_FIT_PROFILE,
    interests: subjectMap[a.subjectEnjoy] || "",
    careerArea: careerMap[a.careerCuriosity] || "",
    strengths: [a.workStyle, a.studyPace, a.afterSchool].filter(Boolean).join(", "),
  };
}

export function computeProgrammeInterestScore(programme, evaluation, answers, requirementGrades) {
  const profile = {
    ...oldAnswersToProfile(answers),
    requirementGrades,
    bestSixTotal: evaluation?.total,
  };
  const result = scoreProgrammeFit(programme, profile);
  return {
    interestScore: result.fitScore,
    scoreBreakdown: { quiz: Math.min(40, result.fitScore), careers: 0, grades: 0 },
  };
}

export function hasSubjectRequirementFailure(programme, requirementGrades) {
  const reqs = programme.subjectRequirements || {};
  for (const [key, req] of Object.entries(reqs)) {
    const userG = requirementGrades?.[key];
    if (!userG?.trim() || !meetsSubjectRequirement(userG, req)) return true;
  }
  return false;
}

export function assignFitBucket(status, interestScore, total, minPoints, subjectFail) {
  if (status === "Qualified") return interestScore >= 60 ? "strong" : "worth";
  if (status === "Close") return "worth";
  if (status === "Unknown") return interestScore >= 70 ? "worth" : "stretch";
  if (subjectFail) return interestScore >= 72 ? "stretch" : "worth";
  const gap = (typeof minPoints === "number" ? minPoints : 0) - total;
  return gap <= 4 || interestScore >= 72 ? "stretch" : "worth";
}

export function rankProgrammesForFit(programmes, requirementGrades, bestSixTotal, answers) {
  const profile = {
    ...oldAnswersToProfile(answers),
    requirementGrades,
    bestSixTotal,
  };
  return rankProgrammeMatches(programmes, profile).map((row) => {
    const programme = row.programme;
    const evaluation = row.admission;
    const subjectFail = hasSubjectRequirementFailure(programme, requirementGrades);
    return {
      programme,
      evaluation,
      admission: evaluation,
      interestScore: row.fitScore,
      fitScore: row.fitScore,
      scoreBreakdown: { quiz: row.fitScore, careers: 0, grades: 0 },
      bucket: assignFitBucket(
        evaluation.status,
        row.fitScore,
        evaluation.total,
        programmeHasAdmissionPoints(programme) ? programme.minPoints : null,
        subjectFail,
      ),
      subjectFail,
      why: row.why,
      concerns: row.concerns,
      nextSteps: row.nextSteps,
      matchedInstitution: row.matchedInstitution,
      applyLink: row.applyLink,
    };
  });
}

export function parseFitAnswers(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_FIT_PROFILE };
  return {
    interests: String(raw.interests ?? ""),
    careerArea: String(raw.careerArea ?? raw.careerCuriosity ?? ""),
    preferredInstitution: String(raw.preferredInstitution ?? ""),
    qualificationLevel: String(raw.qualificationLevel ?? ""),
    studyMode: String(raw.studyMode ?? ""),
    strengths: String(raw.strengths ?? ""),
    avoidSubjects: Array.isArray(raw.avoidSubjects) ? raw.avoidSubjects.map(String) : toList(raw.avoidSubjects),
  };
}

export function loadFitAnswersFromStorage() {
  try {
    const raw = localStorage.getItem(FIT_FINDER_ANSWERS_KEY);
    if (!raw) return { ...DEFAULT_FIT_PROFILE };
    return parseFitAnswers(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_FIT_PROFILE };
  }
}

export function saveFitAnswersToStorage(answers) {
  try {
    localStorage.setItem(FIT_FINDER_ANSWERS_KEY, JSON.stringify(parseFitAnswers(answers)));
  } catch {
    /* ignore */
  }
}
