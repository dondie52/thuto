function subject(id, label, { examBoards, requirementKey = null, aliases = [] }) {
  return { id, label, examBoards, requirementKey, aliases };
}

/**
 * Shared subject catalog for predictor-style flows.
 * `requirementKey` connects to programme `subjectRequirements`; only keep keys
 * that already have meaning in the catalogue today.
 */
export const BGCSE_SUBJECTS = [
  subject("english", "English", {
    examBoards: ["bgcse", "igcse"],
    requirementKey: "english",
    aliases: ["english language", "eng", "first language english"],
  }),
  subject("setswana", "Setswana", {
    examBoards: ["bgcse", "igcse"],
    requirementKey: "setswana",
    aliases: ["tswana"],
  }),
  subject("mathematics", "Mathematics", {
    examBoards: ["bgcse", "igcse"],
    requirementKey: "math",
    aliases: ["maths", "mathematics syllabus d", "extended mathematics"],
  }),
  subject("science_double", "Science Double Award", {
    examBoards: ["bgcse"],
    requirementKey: "science",
    aliases: ["double award science", "science double", "double science"],
  }),
  subject("science_single", "Science Single Award", {
    examBoards: ["bgcse"],
    requirementKey: "science",
    aliases: ["single award science", "science single"],
  }),
  subject("biology", "Biology", {
    examBoards: ["bgcse", "igcse"],
    requirementKey: "science",
    aliases: ["bio"],
  }),
  subject("chemistry", "Chemistry", {
    examBoards: ["bgcse", "igcse"],
    requirementKey: "science",
    aliases: ["chem"],
  }),
  subject("physics", "Physics", {
    examBoards: ["bgcse", "igcse"],
    requirementKey: "science",
    aliases: ["phy"],
  }),
  subject("geography", "Geography", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["geo"],
  }),
  subject("history", "History", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["hist"],
  }),
  subject("social_studies", "Social Studies", {
    examBoards: ["bgcse", "igcse"],
    requirementKey: "socialStudies",
    aliases: ["social studies"],
  }),
  subject("development_studies", "Development Studies", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["dev studies", "development"],
  }),
  subject("religious_education", "Religious Education", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["re", "religious studies"],
  }),
  subject("literature_english", "Literature in English", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["literature", "lit in english", "english literature"],
  }),
  subject("accounting", "Accounting", {
    examBoards: ["bgcse", "igcse"],
    requirementKey: "businessStudies",
    aliases: ["accounts", "principles of accounts"],
  }),
  subject("business_studies", "Business Studies", {
    examBoards: ["bgcse", "igcse"],
    requirementKey: "businessStudies",
    aliases: ["business"],
  }),
  subject("commerce", "Commerce", {
    examBoards: ["bgcse"],
    aliases: ["commercial studies"],
  }),
  subject("economics", "Economics", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["econ"],
  }),
  subject("agriculture", "Agriculture", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["agric", "agriculture science"],
  }),
  subject("design_technology", "Design and Technology", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["design & technology", "d&t", "design technology"],
  }),
  subject("food_nutrition", "Food and Nutrition", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["food and nutrition studies", "food nutrition"],
  }),
  subject("home_management", "Home Management", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["home economics"],
  }),
  subject("hospitality_tourism", "Hospitality and Tourism Studies", {
    examBoards: ["bgcse"],
    aliases: ["hospitality", "tourism studies", "hospitality and tourism"],
  }),
  subject("art_design", "Art and Design", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["art", "art & design"],
  }),
  subject("computer_studies", "Computer Studies", {
    examBoards: ["bgcse"],
    aliases: ["computing", "computer science"],
  }),
  subject("physical_education", "Physical Education", {
    examBoards: ["bgcse", "igcse"],
    aliases: ["pe", "p.e."],
  }),
  subject("music", "Music", {
    examBoards: ["bgcse", "igcse"],
    aliases: [],
  }),
  subject("horticulture", "Horticulture", {
    examBoards: ["bgcse"],
    aliases: [],
  }),
  subject("fashion_fabrics", "Fashion and Fabrics", {
    examBoards: ["bgcse"],
    aliases: ["fashion & fabrics", "textiles"],
  }),
  subject("animal_production", "Animal Production", {
    examBoards: ["bgcse"],
    aliases: [],
  }),
  subject("field_crop_production", "Field Crop Production", {
    examBoards: ["bgcse"],
    aliases: ["crop production"],
  }),
  subject("french", "French", {
    examBoards: ["igcse"],
    aliases: [],
  }),
  subject("ict", "Information and Communication Technology", {
    examBoards: ["igcse"],
    aliases: ["information communication technology", "i.c.t.", "ict"],
  }),
  subject("physical_science", "Physical Science", {
    examBoards: ["igcse"],
    requirementKey: "science",
    aliases: ["physical sciences"],
  }),
  subject("travel_tourism", "Travel and Tourism", {
    examBoards: ["igcse"],
    aliases: ["travel & tourism"],
  }),
  subject("coordinated_science", "Coordinated Science", {
    examBoards: ["igcse"],
    requirementKey: "science",
    aliases: ["co ordinated science", "coordinated sciences", "combined science"],
  }),
];

export const SUBJECTS_BY_ID = Object.fromEntries(BGCSE_SUBJECTS.map((subjectMeta) => [subjectMeta.id, subjectMeta]));
export const BGCSE_SUBJECT_BY_ID = SUBJECTS_BY_ID;

export const SUBJECT_LABELS = BGCSE_SUBJECTS.map((subjectMeta) => subjectMeta.label);
