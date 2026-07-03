/**
 * Adds BIUST and Limkokwing programmes from partner intake flyers
 * (src/lib/institutionCampaigns.js) into public/data/programmes.json.
 *
 * - Inserts missing programme stubs with stable ids.
 * - Updates names/faculties on close existing matches (ids unchanged).
 *
 * Usage: node scripts/merge-campaign-programmes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");

const BIUST_SITE = "https://www.biust.ac.bw/";
const BIUST_APPLY = "https://www.biust.ac.bw/admissions";
const LIMK_SITE = "https://www.limkokwing.net/botswana/";
const LIMK_APPLY = "https://www.limkokwing.net/botswana/admissions";
const LIMK_DEADLINE = "2026-08-10";

/** @param {string} name */
function durationForName(name) {
  const n = name.toLowerCase();
  if (n.startsWith("certificate")) return { duration: "1 year", durationYears: 1 };
  if (n.startsWith("diploma")) return { duration: "2 years", durationYears: 2 };
  if (n.includes("associate degree")) return { duration: "2 years", durationYears: 2 };
  return { duration: "3 years", durationYears: 3 };
}

/** @param {string} name */
function fieldForBiust(name) {
  const n = name.toLowerCase();
  if (n.startsWith("beng")) return "Engineering";
  if (/cyber|data science|information systems|software|telecom|computer/.test(n)) return "Technology";
  if (/business|finance|economics/.test(n)) return "Business";
  return "Natural Sciences";
}

/** @param {string} name */
function fieldForLimkokwing(name, faculty) {
  const n = name.toLowerCase();
  if (/bsc|information technology|software|information systems/.test(n)) return "Technology";
  if (/bbus|business|finance|bank|tourism|hospitality/.test(n)) return "Business";
  if (/architecture|construction|interior/.test(n)) return "Engineering";
  return "Humanities";
}

/**
 * @param {object} p
 */
function biustStub({ id, name, faculty, field }) {
  const dur = name.toLowerCase().startsWith("beng")
    ? { duration: "5 years", durationYears: 5 }
    : { duration: "4 years", durationYears: 4 };
  return {
    id,
    name,
    field: field || fieldForBiust(name),
    university: "BIUST",
    universityShort: "BIUST",
    faculty,
    minPoints: null,
    subjectRequirements: {},
    ...dur,
    description: "Programme at BIUST. Confirm entry requirements with the institution.",
    officialUrl: BIUST_SITE,
    applyUrl: BIUST_APPLY,
    modules: [],
    careers: [],
    minPointsScaleVersion: 2,
    interests: [field || fieldForBiust(name), faculty].filter(Boolean),
    tags: [field || fieldForBiust(name)],
  };
}

/**
 * @param {object} p
 */
function limkokwingStub({ id, name, faculty }) {
  const field = fieldForLimkokwing(name, faculty);
  return {
    id,
    name,
    field,
    university: "Limkokwing University of Creative Technology",
    universityShort: "Limkokwing",
    faculty,
    minPoints: null,
    subjectRequirements: {},
    ...durationForName(name),
    description: "Programme at Limkokwing Botswana. Confirm entry requirements with the institution.",
    officialUrl: LIMK_SITE,
    applyUrl: LIMK_APPLY,
    applicationDeadline: LIMK_DEADLINE,
    modules: [],
    careers: [],
    minPointsScaleVersion: 2,
    interests: [field, faculty].filter(Boolean),
    tags: [field],
  };
}

/** Existing id -> flyer-aligned patch (name/faculty only). */
const BIUST_UPDATES = [
  ["biust-bsc-physics-general", "BSc Applied Physics", "School of Pure & Applied Sciences"],
  ["biust-bsc-data", "BSc Data Science", "School of Pure & Applied Sciences"],
  ["biust-beng-civil", "BEng (Hons) Civil & Environmental Engineering", "School of Earth Sciences & Engineering"],
  ["biust-beng-mining", "BEng (Hons) Mining Engineering", "School of Earth Sciences & Engineering"],
  ["biust-beng-industrial", "BEng (Hons) Industrial and Manufacturing Engineering", "School of Electrical & Mechanical Engineering"],
  ["biust-beng-mechanical", "BEng (Hons) Mechanical and Energy Engineering", "School of Electrical & Mechanical Engineering"],
  ["biust-beng-mechanical-engineering", "BEng (Hons) Mechanical and Energy Engineering", "School of Electrical & Mechanical Engineering"],
  ["biust-bsc-geology", "BSc Applied Geology", "School of Earth Sciences & Engineering"],
  ["biust-bsc-env", "BSc Ecosystem Science and Sustainability", "School of Earth Sciences & Engineering"],
];

const BIUST_NEW = [
  biustStub({
    id: "biust-bsc-chemistry-materials",
    name: "BSc Chemistry (Materials and Applied Chemistry)",
    faculty: "School of Pure & Applied Sciences",
  }),
  biustStub({
    id: "biust-bsc-chemistry-drug-discovery",
    name: "BSc Chemistry (Drug Discovery and Development)",
    faculty: "School of Pure & Applied Sciences",
  }),
  biustStub({
    id: "biust-bsc-chemistry-environmental",
    name: "BSc Chemistry (Environmental & Analytical Chemistry)",
    faculty: "School of Pure & Applied Sciences",
  }),
  biustStub({
    id: "biust-bsc-forensic-science",
    name: "BSc Forensic Science",
    faculty: "School of Pure & Applied Sciences",
  }),
  biustStub({
    id: "biust-bsc-mathematical-sciences",
    name: "BSc Mathematical Sciences",
    faculty: "School of Pure & Applied Sciences",
  }),
  biustStub({
    id: "biust-bsc-industrial-mathematics",
    name: "BSc Industrial Mathematics",
    faculty: "School of Pure & Applied Sciences",
  }),
  biustStub({
    id: "biust-bsc-statistics",
    name: "BSc Statistics",
    faculty: "School of Pure & Applied Sciences",
  }),
  biustStub({
    id: "biust-bsc-cyber-security-digital-forensics",
    name: "BSc Cyber Security and Digital Forensics",
    faculty: "School of Pure & Applied Sciences",
    field: "Technology",
  }),
  biustStub({
    id: "biust-beng-computer-telecommunications",
    name: "BEng (Hons) Computer and Telecommunications Engineering",
    faculty: "School of Electrical & Mechanical Engineering",
  }),
  biustStub({
    id: "biust-beng-electrical-communications",
    name: "BEng (Hons) Electrical and Communications Engineering",
    faculty: "School of Electrical & Mechanical Engineering",
  }),
  biustStub({
    id: "biust-beng-mechatronics-industrial-instrumentation",
    name: "BEng (Hons) Mechatronics and Industrial Instrumentation",
    faculty: "School of Electrical & Mechanical Engineering",
  }),
  biustStub({
    id: "biust-beng-chemical-engineering",
    name: "BEng (Hons) Chemical Engineering",
    faculty: "School of Earth Sciences & Engineering",
  }),
  biustStub({
    id: "biust-beng-materials-metallurgical",
    name: "BEng (Hons) Materials & Metallurgical Engineering",
    faculty: "School of Earth Sciences & Engineering",
  }),
  biustStub({
    id: "biust-beng-geological-engineering",
    name: "BEng (Hons) Geological Engineering",
    faculty: "School of Earth Sciences & Engineering",
  }),
  biustStub({
    id: "biust-bsc-ecology-evolutionary-biology",
    name: "BSc (Hons) Ecology and Evolutionary Biology",
    faculty: "School of Life Sciences",
  }),
];

const LIMKOKWING_UPDATES = [
  ["limkokwing-bsc-software", "BSc in Software Engineering", "Faculty of Information Communication Technology"],
  ["limkokwing-bachelor-creative-multimedia", "BA in Creative Multimedia", "Faculty of Information Communication Technology"],
  ["limkokwing-diploma-graphic", "Diploma in Graphic Design", "Faculty of Design Innovation"],
];

const LIMKOKWING_NEW = [
  limkokwingStub({
    id: "limkokwing-bsc-it-security",
    name: "BSc in Information Technology Security",
    faculty: "Faculty of Information Communication Technology",
  }),
  limkokwingStub({
    id: "limkokwing-bsc-information-systems",
    name: "BSc in Information Systems",
    faculty: "Faculty of Information Communication Technology",
  }),
  limkokwingStub({
    id: "limkokwing-diploma-information-technology",
    name: "Diploma in Information Technology",
    faculty: "Faculty of Information Communication Technology",
  }),
  limkokwingStub({
    id: "limkokwing-ba-visual-communication",
    name: "BA in Visual Communication",
    faculty: "Faculty of Design Innovation",
  }),
  limkokwingStub({
    id: "limkokwing-ba-industrial-design",
    name: "BA in Industrial Design",
    faculty: "Faculty of Design Innovation",
  }),
  limkokwingStub({
    id: "limkokwing-diploma-fashion-design",
    name: "Diploma in Fashion Design",
    faculty: "Faculty of Design Innovation",
  }),
  limkokwingStub({
    id: "limkokwing-bbus-international-business",
    name: "BBus in International Business",
    faculty: "Faculty of Business and Globalisation",
  }),
  limkokwingStub({
    id: "limkokwing-bbus-finance-banking",
    name: "BBus in Finance and Banking",
    faculty: "Faculty of Business and Globalisation",
  }),
  limkokwingStub({
    id: "limkokwing-bbus-tourism-management",
    name: "BBus in Tourism Management",
    faculty: "Faculty of Business and Globalisation",
  }),
  limkokwingStub({
    id: "limkokwing-bbus-hospitality-management",
    name: "BBus in Hospitality Management",
    faculty: "Faculty of Business and Globalisation",
  }),
  limkokwingStub({
    id: "limkokwing-ba-interior-architecture",
    name: "BA in Interior Architecture",
    faculty: "Faculty of Architecture & the Built Environment",
  }),
  limkokwingStub({
    id: "limkokwing-associate-architectural-technology",
    name: "Associate Degree in Architectural Technology",
    faculty: "Faculty of Architecture & the Built Environment",
  }),
  limkokwingStub({
    id: "limkokwing-cert-construction-management",
    name: "Certificate in Construction Management",
    faculty: "Faculty of Architecture & the Built Environment",
  }),
  limkokwingStub({
    id: "limkokwing-ba-professional-communication",
    name: "BA in Professional Communication",
    faculty: "Faculty of Communication, Media & Broadcasting",
  }),
  limkokwingStub({
    id: "limkokwing-ba-digital-film-television",
    name: "BA in Digital Film and Television",
    faculty: "Faculty of Communication, Media & Broadcasting",
  }),
  limkokwingStub({
    id: "limkokwing-ba-broadcasting-journalism",
    name: "BA in Broadcasting and Journalism",
    faculty: "Faculty of Communication, Media & Broadcasting",
  }),
  limkokwingStub({
    id: "limkokwing-ba-events-management",
    name: "BA in Events Management",
    faculty: "Faculty of Communication, Media & Broadcasting",
  }),
];

function main() {
  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const byId = new Map(programmes.map((p) => [p.id, p]));

  let updated = 0;
  let added = 0;

  for (const [id, name, faculty] of BIUST_UPDATES) {
    const row = byId.get(id);
    if (!row) continue;
    row.name = name;
    row.faculty = faculty;
    if (!row.interests?.includes(faculty)) {
      row.interests = [...new Set([...(row.interests || []), faculty])];
    }
    updated++;
  }

  for (const [id, name, faculty] of LIMKOKWING_UPDATES) {
    const row = byId.get(id);
    if (!row) continue;
    row.name = name;
    row.faculty = faculty;
    if (!row.interests?.includes(faculty)) {
      row.interests = [...new Set([...(row.interests || []), faculty])];
    }
    updated++;
  }

  for (const row of [...BIUST_NEW, ...LIMKOKWING_NEW]) {
    if (byId.has(row.id)) continue;
    programmes.push(row);
    byId.set(row.id, row);
    added++;
  }

  fs.writeFileSync(progPath, `${JSON.stringify(programmes, null, 2)}\n`);
  console.error(`Campaign programmes: ${added} added, ${updated} updated.`);
}

main();
