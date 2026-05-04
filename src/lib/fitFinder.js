import {
  evaluateProgramme,
  gradeToPoints,
  meetsSubjectRequirement,
  programmeHasAdmissionPoints,
} from "./admissions.js";

/** Persisted quiz answers (localStorage) so refresh on results step keeps context */
export const FIT_FINDER_ANSWERS_KEY = "thuto_fit_finder_answers_v1";

/**
 * @typedef {{
 *   workStyle: 'hands_on' | 'numbers_logic' | 'creative' | 'people_helping' | 'organising_business',
 *   subjectEnjoy: 'math_science' | 'languages_writing' | 'business_economics' | 'arts_design' | 'social_people',
 *   careerCuriosity: 'tech_computing' | 'health_science' | 'business_money' | 'law_policy' | 'engineering_build' | 'teach_community' | 'exploring',
 *   studyPace: 'practical_coursework' | 'reading_research' | 'mix',
 *   afterSchool: 'stable_career' | 'help_people' | 'creative_work' | 'own_business' | 'not_sure',
 * }} FitFinderAnswers
 */

/** @type {FitFinderAnswers} */
export const DEFAULT_FIT_ANSWERS = {
  workStyle: "numbers_logic",
  subjectEnjoy: "math_science",
  careerCuriosity: "exploring",
  studyPace: "mix",
  afterSchool: "not_sure",
};

/** Question copy for the UI - values are stable ids for scoring */
export const FIT_FINDER_QUESTIONS = [
  {
    id: "workStyle",
    title: "What kind of work sounds most like you?",
    subtitle: "Pick the closest match - there is no wrong answer.",
    options: [
      { value: "hands_on", label: "Hands-on building or fixing things" },
      { value: "numbers_logic", label: "Numbers, patterns, and logical puzzles" },
      { value: "creative", label: "Design, media, or creative projects" },
      { value: "people_helping", label: "Helping, teaching, or working with people" },
      { value: "organising_business", label: "Leading projects, business, or organising teams" },
    ],
  },
  {
    id: "subjectEnjoy",
    title: "At school, what do you enjoy most?",
    options: [
      { value: "math_science", label: "Maths, science, or computer-type subjects" },
      { value: "languages_writing", label: "Languages, reading, or writing essays" },
      { value: "business_economics", label: "Business, commerce, or economics ideas" },
      { value: "arts_design", label: "Art, design, music, or practical creative subjects" },
      { value: "social_people", label: "Social studies, debates, or community topics" },
    ],
  },
  {
    id: "careerCuriosity",
    title: "After university, what direction sounds interesting?",
    options: [
      { value: "tech_computing", label: "Tech, software, data, or IT systems" },
      { value: "health_science", label: "Health, biology, environment, or lab science" },
      { value: "business_money", label: "Business, finance, marketing, or entrepreneurship" },
      { value: "law_policy", label: "Law, policy, government, or advocacy" },
      { value: "engineering_build", label: "Engineering, infrastructure, or energy" },
      { value: "teach_community", label: "Teaching, community work, or human services" },
      { value: "exploring", label: "Still exploring - show me a mix" },
    ],
  },
  {
    id: "studyPace",
    title: "How do you prefer to learn?",
    options: [
      { value: "practical_coursework", label: "Projects, labs, and practical coursework" },
      { value: "reading_research", label: "Reading, research, and structured theory" },
      { value: "mix", label: "A balance of both" },
    ],
  },
  {
    id: "afterSchool",
    title: "What matters most to you after graduation?",
    options: [
      { value: "stable_career", label: "A stable career path and employability" },
      { value: "help_people", label: "Making a difference for people or communities" },
      { value: "creative_work", label: "Creative freedom in my work" },
      { value: "own_business", label: "Running my own business or side projects" },
      { value: "not_sure", label: "Not sure yet" },
    ],
  },
];

/**
 * @param {string | undefined} field
 * @param {FitFinderAnswers} a
 * @returns {number} 0–40 quiz contribution (before strength bonus)
 */
function quizScoreForProgramme(field, a) {
  const f = (field || "").toLowerCase();
  let score = 0;

  // Work style vs broad field
  if (f === "science") {
    if (a.workStyle === "numbers_logic") score += 14;
    if (a.workStyle === "hands_on") score += 10;
    if (a.subjectEnjoy === "math_science") score += 14;
  } else if (f === "engineering") {
    if (a.workStyle === "hands_on" || a.workStyle === "numbers_logic") score += 16;
    if (a.subjectEnjoy === "math_science") score += 14;
  } else if (f === "business") {
    if (a.workStyle === "organising_business") score += 16;
    if (a.subjectEnjoy === "business_economics") score += 16;
  } else if (f === "humanities") {
    if (a.workStyle === "people_helping" || a.workStyle === "organising_business") score += 12;
    if (a.subjectEnjoy === "languages_writing" || a.subjectEnjoy === "social_people") score += 16;
  }

  // Career curiosity vs field + light keyword vibes (programme careers handled separately)
  const career = a.careerCuriosity;
  if (career === "exploring") score += 8;
  else if (career === "tech_computing" && (f === "science" || f === "engineering")) score += 18;
  else if (career === "health_science" && f === "science") score += 18;
  else if (career === "business_money" && f === "business") score += 18;
  else if (career === "law_policy" && f === "humanities") score += 18;
  else if (career === "engineering_build" && f === "engineering") score += 20;
  else if (career === "teach_community" && (f === "humanities" || f === "business")) score += 12;

  // Study pace (light)
  if (a.studyPace === "mix") score += 6;
  else if (a.studyPace === "practical_coursework" && (f === "engineering" || f === "science")) score += 8;
  else if (a.studyPace === "reading_research" && f === "humanities") score += 8;

  // After school priorities (light)
  if (a.afterSchool === "stable_career") score += 6;
  if (a.afterSchool === "help_people" && (f === "humanities" || career === "teach_community")) score += 8;
  if (a.afterSchool === "own_business" && f === "business") score += 8;
  if (a.afterSchool === "creative_work" && (f === "humanities" || career === "exploring")) score += 6;

  return Math.min(40, score);
}

/** @param {string[]} careers */
function careerKeywordScore(careers, a) {
  const list = (careers || []).map((c) => String(c).toLowerCase());
  if (!list.length) return a.careerCuriosity === "exploring" ? 10 : 4;

  const has = (/** @type {string[]} */ words) => list.some((c) => words.some((w) => c.includes(w)));

  let s = 0;
  switch (a.careerCuriosity) {
    case "tech_computing":
      if (has(["software", "data", "it", "developer", "analyst", "systems", "machine", "intelligence", "programming"]))
        s = 22;
      break;
    case "health_science":
      if (has(["lab", "environment", "biology", "health", "research", "gis", "sustain", "energy", "technical"]))
        s = 22;
      break;
    case "business_money":
      if (has(["account", "finance", "market", "business", "economist", "bank", "trainee", "entrepreneur", "operations"]))
        s = 22;
      break;
    case "law_policy":
      if (has(["law", "policy", "legal", "government", "advoc"])) s = 22;
      break;
    case "engineering_build":
      if (has(["engineer", "mechanical", "maintenance", "energy"])) s = 22;
      break;
    case "teach_community":
      if (has(["teacher", "community", "coordinator", "officer", "social"])) s = 18;
      break;
    default:
      s = 10;
  }
  return Math.min(22, s);
}

/**
 * How strongly the student's grades cover this programme's subject requirements (0–28).
 * @param {Record<string, string>} requirementGrades
 * @param {Record<string, string>} programmeReqs
 */
function requirementStrengthBonus(requirementGrades, programmeReqs) {
  const reqs = programmeReqs || {};
  let bonus = 0;
  for (const [key, requiredGrade] of Object.entries(reqs)) {
    const userG = requirementGrades[key];
    if (!userG?.trim()) continue;
    if (!meetsSubjectRequirement(userG, requiredGrade)) continue;
    const u = gradeToPoints(userG);
    const r = gradeToPoints(requiredGrade);
    if (u == null || r == null) continue;
    bonus += Math.min(10, 4 + (u - r) * 2);
  }
  return Math.min(28, bonus);
}

/**
 * @param {object} programme from programmes.json
 * @param {{ status: string, total: number }} evaluation from evaluateProgramme
 * @param {FitFinderAnswers} answers
 * @param {Record<string, string>} requirementGrades
 * @returns {{ interestScore: number, scoreBreakdown: { quiz: number, careers: number, grades: number } }}
 */
export function computeProgrammeInterestScore(programme, evaluation, answers, requirementGrades) {
  const quiz = quizScoreForProgramme(programme.field, answers);
  const careers = careerKeywordScore(programme.careers, answers);
  const grades = requirementStrengthBonus(requirementGrades || {}, programme.subjectRequirements || {});
  const interestScore = Math.min(100, Math.round(quiz + careers + grades));
  return {
    interestScore,
    scoreBreakdown: { quiz, careers, grades },
  };
}

/**
 * True if any subject requirement fails (points may still be OK).
 * @param {object} programme
 * @param {Record<string, string>} requirementGrades
 */
export function hasSubjectRequirementFailure(programme, requirementGrades) {
  const reqs = programme.subjectRequirements || {};
  for (const [key, req] of Object.entries(reqs)) {
    const userG = requirementGrades[key];
    if (!userG?.trim() || !meetsSubjectRequirement(userG, req)) return true;
  }
  return false;
}

/**
 * @param {'Qualified'|'Close'|'Not eligible'|'Unknown'} status
 * @param {number} interestScore
 * @param {number} total user best-six
 * @param {number | null | undefined} minPoints programme min
 * @param {boolean} subjectFail
 * @returns {'strong'|'worth'|'stretch'}
 */
export function assignFitBucket(status, interestScore, total, minPoints, subjectFail) {
  if (status === "Unknown") return "worth";

  const min = typeof minPoints === "number" && Number.isFinite(minPoints) ? minPoints : 0;
  const gap = min - total;

  if (status === "Qualified") {
    return interestScore >= 36 ? "strong" : "worth";
  }
  if (status === "Close") {
    return "worth";
  }
  // Not eligible
  if (subjectFail) {
    if (interestScore >= 46) return "stretch";
    return "worth";
  }
  // Points-only failure
  if (gap <= 4) return "worth";
  if (interestScore >= 48) return "stretch";
  return "worth";
}

/**
 * @param {object[]} programmes
 * @param {Record<string, string>} requirementGrades
 * @param {number} bestSixTotal
 * @param {FitFinderAnswers} answers
 * @returns {Array<{ programme: object, evaluation: ReturnType<typeof evaluateProgramme>, interestScore: number, scoreBreakdown: object, bucket: 'strong'|'worth'|'stretch', subjectFail: boolean }>}
 */
export function rankProgrammesForFit(programmes, requirementGrades, bestSixTotal, answers) {
  const out = [];
  for (const programme of programmes) {
    const evaluation = evaluateProgramme(programme, requirementGrades, bestSixTotal);
    const { interestScore, scoreBreakdown } = computeProgrammeInterestScore(
      programme,
      evaluation,
      answers,
      requirementGrades,
    );
    const subjectFail = hasSubjectRequirementFailure(programme, requirementGrades);
    const bucket = assignFitBucket(
      evaluation.status,
      interestScore,
      evaluation.total,
      programmeHasAdmissionPoints(programme) ? programme.minPoints : null,
      subjectFail,
    );
    out.push({ programme, evaluation, interestScore, scoreBreakdown, bucket, subjectFail });
  }

  function bucketOrder(b) {
    if (b === "strong") return 0;
    if (b === "worth") return 1;
    return 2;
  }
  function statusOrder(s) {
    if (s === "Qualified") return 0;
    if (s === "Close") return 1;
    if (s === "Not eligible") return 2;
    return 3;
  }

  out.sort((a, b) => {
    const bo = bucketOrder(a.bucket) - bucketOrder(b.bucket);
    if (bo !== 0) return bo;
    const io = b.interestScore - a.interestScore;
    if (io !== 0) return io;
    const so = statusOrder(a.evaluation.status) - statusOrder(b.evaluation.status);
    if (so !== 0) return so;
    return String(a.programme.name).localeCompare(String(b.programme.name));
  });
  return out;
}

/**
 * @param {FitFinderAnswers | null | undefined} raw
 * @returns {FitFinderAnswers}
 */
export function parseFitAnswers(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_FIT_ANSWERS };
  return {
    workStyle: raw.workStyle ?? DEFAULT_FIT_ANSWERS.workStyle,
    subjectEnjoy: raw.subjectEnjoy ?? DEFAULT_FIT_ANSWERS.subjectEnjoy,
    careerCuriosity: raw.careerCuriosity ?? DEFAULT_FIT_ANSWERS.careerCuriosity,
    studyPace: raw.studyPace ?? DEFAULT_FIT_ANSWERS.studyPace,
    afterSchool: raw.afterSchool ?? DEFAULT_FIT_ANSWERS.afterSchool,
  };
}

export function loadFitAnswersFromStorage() {
  try {
    const raw = localStorage.getItem(FIT_FINDER_ANSWERS_KEY);
    if (!raw) return { ...DEFAULT_FIT_ANSWERS };
    return parseFitAnswers(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_FIT_ANSWERS };
  }
}

/** @param {FitFinderAnswers} answers */
export function saveFitAnswersToStorage(answers) {
  try {
    localStorage.setItem(FIT_FINDER_ANSWERS_KEY, JSON.stringify(answers));
  } catch {
    /* ignore */
  }
}
