/**
 * Full BGCSE subject list for the predictor. `requirementKey` maps into
 * `subjectRequirements` in programmes.json; multiple science subjects share `science`
 * - we take the best grade among them for eligibility (see rowsToRequirementGrades).
 * `null` = counts only toward best-six points, not toward a named requirement slot.
 */
export const BGCSE_SUBJECTS = [
  { id: "mathematics", label: "Mathematics", requirementKey: "math" },
  { id: "english", label: "English Language", requirementKey: "english" },
  { id: "setswana", label: "Setswana", requirementKey: "setswana" },
  { id: "biology", label: "Biology", requirementKey: "science" },
  { id: "chemistry", label: "Chemistry", requirementKey: "science" },
  { id: "physics", label: "Physics", requirementKey: "science" },
  { id: "combined_science", label: "Combined Science", requirementKey: "science" },
  { id: "science_double", label: "Science (Double Award)", requirementKey: "science" },
  { id: "science_single", label: "Science (Single Award)", requirementKey: "science" },
  { id: "social_studies", label: "Social Studies", requirementKey: "socialStudies" },
  { id: "history", label: "History", requirementKey: null },
  { id: "geography", label: "Geography", requirementKey: null },
  { id: "agriculture", label: "Agriculture", requirementKey: null },
  { id: "business_studies", label: "Business Studies", requirementKey: "businessStudies" },
  { id: "accounting", label: "Accounting", requirementKey: "businessStudies" },
  { id: "computer_studies", label: "Computer Studies", requirementKey: null },
  { id: "design_technology", label: "Design & Technology", requirementKey: null },
  { id: "art", label: "Art & Design", requirementKey: null },
  { id: "home_management", label: "Home Management", requirementKey: null },
  { id: "physical_education", label: "Physical Education", requirementKey: null },
  { id: "music", label: "Music", requirementKey: null },
  { id: "religious_education", label: "Religious Education", requirementKey: null },
  { id: "french", label: "French", requirementKey: null },
  { id: "development_studies", label: "Development Studies", requirementKey: null },
];

/** @type {Record<string, { id: string, label: string, requirementKey: string | null }>} */
export const BGCSE_SUBJECT_BY_ID = Object.fromEntries(BGCSE_SUBJECTS.map((s) => [s.id, s]));
