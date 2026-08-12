/**
 * Add Mangosuthu University of Technology (MUT) — Umlazi, KwaZulu-Natal — and its
 * undergraduate programme catalogue to the Thuto dataset.
 *
 * Source: MUT Undergraduate Prospectus extract supplied by the user (diplomas, degrees,
 * and 6-month bridging/access programmes across Engineering, Management Sciences, and
 * Natural Sciences).
 *
 * NOTE on scale: `minPoints`/`subjectRequirements` are always expressed on Thuto's Botswana
 * BGCSE 48-point best-six scale (see src/lib/gradingSystems.js). MUT's "faculty admission
 * points" (best-six NSC levels, not APS) are a different scale with no established conversion
 * in this codebase, so those fields are left null/{} here — matching every other South
 * African programme already in programmes.json. Raw NSC-level requirements are kept as plain
 * text in `requirements`.
 *
 * Usage: node scripts/merge-mut-2026.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const uniPath = path.join(root, "public/data/universities.json");
const progPath = path.join(root, "public/data/programmes.json");

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const UNIVERSITY_NAME = "Mangosuthu University of Technology";
const UNIVERSITY_SHORT = "MUT";

const university = {
  id: "mut",
  name: UNIVERSITY_NAME,
  shortName: UNIVERSITY_SHORT,
  location: "Umlazi, KwaZulu-Natal",
  country: "za",
  description:
    "A University of Technology in Umlazi, KwaZulu-Natal offering diplomas, degrees, and access/bridging programmes with a work-integrated learning curriculum across Engineering, Management Sciences, and Natural Sciences.",
  website: null,
  phone: null,
  applicationOpen: null,
  applicationClose: null,
  academicYearStart: null,
  applyUrl: null,
  featured: false,
  sponsorshipTier: "standard",
  resources: [],
  studentIncentives: [],
};

const FEE_NOTE =
  "Tuition R4,530–R15,350 per semester and residence R4,120–R11,150 per semester (university-wide range; travel, meals, stationery and textbooks not included). Confirm the exact fee for this programme with MUT.";

const CAO_NOTE = "Apply via the Central Applications Office (CAO) — one CAO application can cover more than one programme.";

function programme({ code, name, field, duration, durationYears, requirements, careers, description, deadlineNote }) {
  return {
    id: `mut-${slugify(code || name)}`,
    name,
    field,
    university: UNIVERSITY_NAME,
    universityShort: UNIVERSITY_SHORT,
    country: "za",
    minPoints: null,
    subjectRequirements: {},
    duration,
    durationYears,
    description,
    officialUrl: null,
    applyUrl: null,
    modules: [],
    careers,
    applicationDeadline: null,
    minPointsSource: null,
    minPointsTier: "manual",
    minPointsScaleVersion: 2,
    profileCompleteness: "partial",
    sponsorshipTier: "standard",
    qualification: /bridging/i.test(name) ? "Bridging / Access programme" : /^BSc|^Bachelor/i.test(name) ? "Bachelor's degree" : "Diploma",
    campus: "Umlazi",
    faculty: field === "Business" ? "Faculty of Management Sciences" : field === "Engineering" ? "Faculty of Engineering" : "Faculty of Natural Sciences",
    requirements: [...requirements, CAO_NOTE, deadlineNote, FEE_NOTE].filter(Boolean),
  };
}

const programmes = [
  programme({
    code: "MN-M-CE3",
    name: "Diploma in Chemical Engineering",
    field: "Engineering",
    duration: "3 years",
    durationYears: 3,
    requirements: ["Mathematics Level 4", "Physical Science Level 4", "English First Additional Language Level 4", "English, Mathematics and Physical Science at 50%+; further departmental screening"],
    careers: ["Chemical Engineering Technician", "Plant Operations Assistant", "Process/Unit Operations Research"],
    description: "Diploma preparing chemical engineering technicians who assist chemical engineers and plant operators across chemical, mineral and energy processing.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-CV3",
    name: "Diploma in Civil Engineering",
    field: "Engineering",
    duration: "3 years",
    durationYears: 3,
    requirements: ["Mathematics Level 4", "Physical Science Level 4", "English First Additional Language Level 4", "English, Mathematics and Physical Science at 50%+; further departmental screening"],
    careers: ["Civil Engineering Technician", "Construction Site Supervisor", "Municipal Infrastructure Technician"],
    description: "Diploma preparing civil engineering technicians for contractors, consultants, government departments and municipalities working on roads, bridges, dams, railways, harbours, buildings and airports.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-SV3",
    name: "Diploma in Surveying",
    field: "Engineering",
    duration: "3 years",
    durationYears: 3,
    requirements: ["Mathematics Level 4", "Physical Science Level 4", "English First Additional Language Level 4", "English, Mathematics and Physical Science at 50%+; further departmental screening"],
    careers: ["Surveyor", "Cartographic Technician"],
    description: "Diploma training surveyors who prepare scaled base maps for construction planning, land development, transportation routes and industrial/residential properties.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-BU3",
    name: "Diploma in Building",
    field: "Engineering",
    duration: "3 years",
    durationYears: 3,
    requirements: ["Mathematics Level 4", "Physical Science Level 4", "English First Additional Language Level 4", "English, Mathematics and Physical Science at 50%+; further departmental screening"],
    careers: ["Construction Manager", "Quantity Surveying Assistant"],
    description: "Diploma covering construction management and quantity-surveying related work — organising, scheduling and directing construction resources and estimating materials and labour.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-EE5",
    name: "Diploma in Electrical Engineering",
    field: "Engineering",
    duration: "3 years",
    durationYears: 3,
    requirements: ["Mathematics Level 4", "Physical Science Level 4", "English First Additional Language Level 4", "English, Mathematics and Physical Science at 50%+; further departmental screening"],
    careers: ["Electrical Engineering Technician", "Process Control Technician", "Electronic Communications Technician"],
    description: "Diploma covering electrical power generation and distribution, process control, electronic communications and computer-based systems.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-ME3",
    name: "Diploma in Mechanical Engineering",
    field: "Engineering",
    duration: "3 years",
    durationYears: 3,
    requirements: ["Mathematics Level 4", "Physical Science Level 4", "English First Additional Language Level 4", "Engineering Graphics & Design Level 4", "English, Mathematics and Physical Science at 50%+; further departmental screening"],
    careers: ["Mechanical Engineering Technician", "Manufacturing/Production Technician"],
    description: "Diploma preparing mechanical engineering technicians for manufacturing, motor, shipbuilding, aircraft, power-station and mining industries.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-CEB",
    name: "Chemical Engineering Bridging Programme",
    field: "Engineering",
    duration: "6 months",
    durationYears: null,
    requirements: ["English Home Language Level 4 or First Additional Language Level 3", "Mathematics Level 3", "Physical Science Level 3", "Designed for applicants who could not fulfil all Diploma entrance requirements"],
    careers: ["Pathway into the Diploma in Chemical Engineering"],
    description: "6-month bridging programme preparing applicants who narrowly miss the Chemical Engineering diploma entry requirements.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-CVB",
    name: "Civil Engineering Bridging Programme",
    field: "Engineering",
    duration: "6 months",
    durationYears: null,
    requirements: ["English Home Language Level 4 or First Additional Language Level 3", "Mathematics Level 3", "Physical Science Level 3", "Designed for applicants who could not fulfil all Diploma entrance requirements"],
    careers: ["Pathway into the Diploma in Civil Engineering"],
    description: "6-month bridging programme preparing applicants who narrowly miss the Civil Engineering diploma entry requirements.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-EEB",
    name: "Electrical Engineering Bridging Programme",
    field: "Engineering",
    duration: "6 months",
    durationYears: null,
    requirements: ["English Home Language Level 4 or First Additional Language Level 3", "Mathematics Level 3", "Physical Science Level 3", "Designed for applicants who could not fulfil all Diploma entrance requirements"],
    careers: ["Pathway into the Diploma in Electrical Engineering"],
    description: "6-month bridging programme preparing applicants who narrowly miss the Electrical Engineering diploma entry requirements.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-MEB",
    name: "Mechanical Engineering Bridging Programme",
    field: "Engineering",
    duration: "6 months",
    durationYears: null,
    requirements: ["English Home Language Level 4 or First Additional Language Level 3", "Mathematics Level 3", "Physical Science Level 3", "Designed for applicants who could not fulfil all Diploma entrance requirements"],
    careers: ["Pathway into the Diploma in Mechanical Engineering"],
    description: "6-month bridging programme preparing applicants who narrowly miss the Mechanical Engineering diploma entry requirements.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-BUB",
    name: "Building Bridging Programme",
    field: "Engineering",
    duration: "6 months",
    durationYears: null,
    requirements: ["English Home Language Level 4 or First Additional Language Level 3", "Mathematics Level 3", "Physical Science Level 3", "Designed for applicants who could not fulfil all Diploma entrance requirements"],
    careers: ["Pathway into the Diploma in Building"],
    description: "6-month bridging programme preparing applicants who narrowly miss the Building diploma entry requirements.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-SVB",
    name: "Surveying Bridging Programme",
    field: "Engineering",
    duration: "6 months",
    durationYears: null,
    requirements: ["English Home Language Level 4 or First Additional Language Level 3", "Mathematics Level 3", "Physical Science Level 3", "Designed for applicants who could not fulfil all Diploma entrance requirements"],
    careers: ["Pathway into the Diploma in Surveying"],
    description: "6-month bridging programme preparing applicants who narrowly miss the Surveying diploma entry requirements.",
    deadlineNote: "Engineering applications close 30 September for first semester intake, 31 May for second semester intake.",
  }),
  programme({
    code: "MN-M-AC3",
    name: "Diploma in Accounting",
    field: "Business",
    duration: "3 or 4 years",
    durationYears: 3,
    requirements: ["English Home Language Level 4 or First Additional Language Level 5", "Accounting Level 4", "Mathematics Level 3 or Mathematical Literacy Level 6", "English, Mathematics and Accounting at 50%+; further departmental screening"],
    careers: ["Accounting Technician", "Bookkeeper", "Financial Clerk"],
    description: "Diploma in accounting and related financial/accounting occupations.",
    deadlineNote: "Management Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-PF3",
    name: "Diploma in Finance and Accounting: Public",
    field: "Business",
    duration: "4 years",
    durationYears: 4,
    requirements: ["English Home Language Level 4 or First Additional Language Level 5", "Accounting Level 4", "Mathematics Level 3 or Mathematical Literacy Level 6", "English, Mathematics and Accounting at 50%+; further departmental screening"],
    careers: ["Public Finance Officer", "Public Sector Accountant"],
    description: "Diploma focused on public finance and accounting roles in government and public-sector institutions.",
    deadlineNote: "Management Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-HR3",
    name: "Diploma in Human Resource Management",
    field: "Business",
    duration: "3 years",
    durationYears: 3,
    requirements: ["English Home Language Level 3 or First Additional Language Level 4", "Accounting", "Mathematics Level 3 or Mathematical Literacy Level 4", "English, Mathematics and Accounting benchmark set by faculty; further departmental screening"],
    careers: ["Skills Development Facilitator", "Employee Assistance Plan Manager", "Recruitment Officer", "Training and Development Officer"],
    description: "Diploma covering recruitment, employee benefits, talent development and HR management practice.",
    deadlineNote: "Management Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-MM3",
    name: "Diploma in Marketing",
    field: "Business",
    duration: "3 years",
    durationYears: 3,
    requirements: ["English Home Language Level 4 or First Additional Language Level 5", "Mathematics Level 3 or Mathematical Literacy Level 4", "Accounting Level 3", "English, Mathematics and Accounting benchmark set by faculty; further departmental screening"],
    careers: ["Marketing Officer", "Advertising Assistant", "Public Relations Officer"],
    description: "Diploma preparing graduates for marketing, advertising and public relations occupations.",
    deadlineNote: "Management Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-OT3",
    name: "Diploma in Office Management and Technology",
    field: "Business",
    duration: "3 years",
    durationYears: 3,
    requirements: ["English Home Language Level 3 or First Additional Language Level 4", "Any other 5 accredited subjects totalling 25 points", "Typing or Computer Studies is an added advantage"],
    careers: ["Administrative Assistant", "Secretary", "Personal Assistant", "Office Professional"],
    description: "Diploma preparing administrative assistants, secretaries, personal assistants and intermediate office professionals.",
    deadlineNote: "Management Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-PU3",
    name: "Diploma in Public Management",
    field: "Business",
    duration: "3 years",
    durationYears: 3,
    requirements: ["English Home Language or First Additional Language Level 4", "Any other 5 accredited subjects totalling 25 points"],
    careers: ["Government/Public Service Administrator", "Municipal Services Officer"],
    description: "Diploma covering government/public-service administration and management of government services.",
    deadlineNote: "Management Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-BE4",
    name: "Bachelor of Science in Environmental Health",
    field: "Health Sciences",
    duration: "4 years",
    durationYears: 4,
    requirements: ["Bachelor's pass", "English Home Language or First Additional Language Level 4", "Mathematics Level 4 or Mathematical Literacy Level 5", "Physical Science Level 4 or Life Science Level 4", "Geography and Agricultural Science Level 5 recommended", "English, Mathematics, Physical/Life Sciences at 50%+ benchmark; further departmental screening"],
    careers: ["Environmental Health Practitioner", "SHEQ Officer", "Waste Management Officer", "Occupational Safety Officer"],
    description: "Degree preparing environmental health practitioners; graduates register with the Health Professions Council of South Africa (HPCSA).",
    deadlineNote: "Natural Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-BLS",
    name: "Bachelor of Health Science in Medical Laboratory Sciences",
    field: "Health Sciences",
    duration: "4 years",
    durationYears: 4,
    requirements: ["Bachelor's pass", "English Home Language Level 4", "Life Sciences Level 4", "Mathematics Level 4", "Physical Science Level 4", "English, Mathematics, Physical/Life Sciences at 50%+ benchmark; further departmental screening"],
    careers: ["Clinical Laboratory Practitioner", "Clinical Chemistry / Haematology / Microbiology / Virology Specialist", "Forensic Science Technician"],
    description: "Degree in clinical laboratory practice with specialisation options including Clinical Chemistry, Haematology, Immunology, Microbiology, Virology and Forensic Science.",
    deadlineNote: "Natural Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-AG3",
    name: "Diploma in Agriculture",
    field: "Agriculture",
    duration: "3 years",
    durationYears: 3,
    requirements: ["Agricultural Science Level 4 or Life Science Level 4", "English Home Language or First Additional Language Level 4", "Mathematics Level 3 or Mathematical Literacy Level 4", "Physical Science Level 3", "Benchmark 50%+; further departmental screening"],
    careers: ["Agricultural Development Officer", "Agricultural Extension Officer", "Farm Manager"],
    description: "Diploma covering agricultural development, extension and farming-industry careers, including animal-production theory and practice.",
    deadlineNote: "Natural Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-BD3",
    name: "Diploma in Biomedical Science",
    field: "Health Sciences",
    duration: "3 years",
    durationYears: 3,
    requirements: ["English Home Language Level 4 or First Additional Language Level 4", "Mathematics Level 4", "Life Sciences Level 4 or Physical Science Level 4", "Compulsory entrance test"],
    careers: ["Pathology Laboratory Technician", "Medical/Food Industry Laboratory Technician", "Medical Equipment / Pharmaceutical Sales"],
    description: "Diploma preparing laboratory technicians for pathology laboratories, food/medical industry labs, and medical-equipment/pharmaceutical sales roles.",
    deadlineNote: "Natural Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-AN3",
    name: "Diploma in Analytical Chemistry",
    field: "Natural Sciences",
    duration: "3 years",
    durationYears: 3,
    requirements: ["English Home Language Level 4 or First Additional Language Level 4", "Mathematics Level 4", "Physical Science Level 4", "English, Mathematics and Physical Science at 50%+ benchmark; further departmental screening"],
    careers: ["Analytical Laboratory Technician", "Quality Control Technician"],
    description: "Diploma preparing analytical laboratory technicians for quality-control and research laboratories.",
    deadlineNote: "Natural Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-CX3",
    name: "Diploma in Community Extension",
    field: "Social Sciences",
    duration: "3 years",
    durationYears: 3,
    requirements: ["English Home Language Level 4", "Level 4 in one of Agricultural Science, Consumer Studies, Life Science, Geography or Economics"],
    careers: ["Community Development Officer", "Rural/Urban Extension Worker"],
    description: "Diploma focused on community extension work covering rural and urban household development, food security, poverty alleviation, and agricultural/social skills.",
    deadlineNote: "Natural Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-NC3",
    name: "Diploma in Nature Conservation",
    field: "Natural Sciences",
    duration: "3 years",
    durationYears: 3,
    requirements: ["English First Additional Language Level 4", "Agricultural Science Level 4 or Life Science Level 4", "Mathematics Level 3"],
    careers: ["Nature Conservator", "Conservation Officer"],
    description: "Diploma serving as a prerequisite for appointment and promotion as a nature conservator with conservation organisations.",
    deadlineNote: "Natural Sciences applications close 30 September.",
  }),
  programme({
    code: "MN-M-IT3",
    name: "Diploma in Information Technology",
    field: "Computing",
    duration: "3 or 4 years",
    durationYears: 3,
    requirements: ["English Home Language Level 3 or First Additional Language Level 3", "Mathematics Level 3 or Mathematical Literacy Level 4", "Minimum 23 points across best 6 subjects including Maths/Maths Literacy and English", "Compulsory entrance test for selected candidates"],
    careers: ["Software Developer", "Systems Analyst", "Database Administrator", "Network Administrator", "Network Technologist"],
    description: "Diploma covering software development (applications, programming, systems analysis, database administration) and communication networks (design, administration, network technologist roles).",
    deadlineNote: "Natural Sciences applications close 30 September.",
  }),
];

function main() {
  const universities = JSON.parse(fs.readFileSync(uniPath, "utf8"));
  const idx = universities.findIndex((u) => u.id === university.id);
  if (idx >= 0) universities[idx] = { ...universities[idx], ...university };
  else universities.push(university);
  fs.writeFileSync(uniPath, `${JSON.stringify(universities, null, 2)}\n`);

  const existing = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const byId = new Map(existing.map((p) => [p.id, p]));
  let added = 0;
  let updated = 0;
  for (const p of programmes) {
    if (byId.has(p.id)) {
      Object.assign(byId.get(p.id), p);
      updated++;
    } else {
      existing.push(p);
      byId.set(p.id, p);
      added++;
    }
  }
  fs.writeFileSync(progPath, `${JSON.stringify(existing, null, 2)}\n`);
  console.error(`MUT merge: university upserted; programmes added ${added}, updated ${updated}.`);
}

main();
