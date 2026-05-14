/**
 * Ensure GUC programmes from the brochure contents exist in `public/data/programmes.json`.
 *
 * This repo's GUC brochure PDF is scanned/image-only, so extracting programme names
 * automatically may fail. This script adds the known programme list (from the contents
 * pages) without deleting any existing GUC programmes.
 *
 * Usage: node scripts/ensure-guc-programmes-contents-2025.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");

const UNIVERSITY_NAME = "Gaborone University College of Law and Professional Studies (GUC)";
const UNIVERSITY_SHORT = "GUC";

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function guessField(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("law") || n.includes("criminology") || n.includes("court") || n.includes("paralegal")) return "Law";
  if (n.includes("nursing") || n.includes("health") || n.includes("public health") || n.includes("counselling")) return "Health";
  if (n.includes("education") || n.includes("teaching") || n.includes("early childhood")) return "Education";
  if (n.includes("engineering") || n.includes("geometrics") || n.includes("mechanic") || n.includes("electronics")) return "Engineering";
  if (n.includes("computer") || n.includes("information") || n.includes("ict") || n.includes("software")) return "Technology";
  if (
    n.includes("account") ||
    n.includes("business") ||
    n.includes("commerce") ||
    n.includes("finance") ||
    n.includes("marketing") ||
    n.includes("management") ||
    n.includes("procurement") ||
    n.includes("supply") ||
    n.includes("entrepreneur")
  )
    return "Business";
  return "Humanities";
}

// From the brochure contents page(s) (GUC 2025).
const CONTENTS_PROGRAMMES = [
  // Graduate Studies Department
  "Executive Master of Business Administration",
  "Master in Business Administration",
  "Master of Commerce in Strategic Marketing",
  "Master of Education in Early Childhood Development",
  "Master of Education in Educational Leadership and Management",
  "Master of Education in Higher Education",
  "Master of Education in Research and Evaluation",
  "Master of Science in Occupational Health and Safety",
  "Post Graduate Diploma in Business Management",
  "Post Graduate Diploma in Education",
  "Post Graduate Diploma in Higher Education",
  "Post Graduate Diploma in Project Management",
  "Post Graduate Diploma in Taxation",
  "Post Graduate Certificate in Enterprise Risk Management",
  "Post Graduate Certificate in Monitoring and Evaluation",
  "Post Graduate Certificate in Curriculum Design and Development",
  "Post Graduate Certificate in Quality Assurance in Education (PGCQAE)",

  // Law Department
  "Bachelor of Law LLB (Hons) (Awarded by Leeds Beckett University)",
  "Bachelor of Arts in Criminology and Security Management",
  "Bachelor of Arts in Law and Public Administration",
  "Bachelor of Arts in Public Administration and Management",
  "Bachelor of Business Administration in Security Management",
  "Diploma in Public Administration and Management",
  "Diploma in Court Administration",
  "Diploma in Criminology",
  "Diploma in Labour Law",
  "Diploma in Law",
  "Diploma in Security Management",
  "Certificate V in Law",
  "Certificate V in Paralegal Studies",

  // School of Nursing
  "Bachelor of Science in Nursing",
  "Certificate V in Health Care Assistance",

  // Business Department
  "Bachelor of Business Administration in Logistics and Transport Management",
  "Bachelor of Commerce in Purchasing and Supply Chain Management",
  "Bachelor of Commerce in Accounting",
  "Bachelor of Business Administration in Entrepreneurship",
  "Bachelor of Commerce in Project Management",
  "Bachelor of Commerce in Business Management",
  "Bachelor of Commerce in Digital Marketing",
  "Bachelor of Commerce in Marketing Management",
  "Bachelor of Commerce in Human Resources Management",
  "Bachelor of Commerce in Risk Management",
  "Bachelor of Arts in Office Management",
  "Bachelor of Business in Tourism Management",
  "Diploma in Event Management",
  "Diploma in Logistics and Transport Management",
  "Diploma in Marketing Management",
  "Diploma in Purchasing and Supply",
  "Diploma in Travel Operations",
  "Diploma in Business Management",
  "Diploma in Retail and Marketing Management",
  "Diploma in Strategic Management and Leadership",
  "Diploma in Library and Information Studies",
  "Diploma in Project Management",
  "Diploma in Secretarial and Administrative Services",
  "Diploma in Human Resources Management",
  "Certificate V in Banking and Finance",
  "Certificate V in Business Accounting",
  "Certificate V in Computerised Accounting",
  "Certificate V in Computer Applications",
  "Certificate V in Customs Clearing and Freight Forwarding",
  "Certificate V in Entrepreneurship",
  "Certificate V in Logistics and Transport Management",
  "Certificate V in Marketing",
  "Certificate V in Marketing and Retail Management",
  "Certificate V in Purchasing and Supply Management",
  "Certificate V in Tourism",
  "Certificate V in Records and Archives Management",
  "Certificate V in Business Management",
  "Certificate V in Human Resources Management",
  "Certificate V in Leadership Development",
  "Certificate V in Project Management",
  "Certificate V in Secretarial Studies",
  "Certificate V in Security Risk Management",
  "Certificate V in Real Estate",
  "Certificate IV in Secretarial Studies",

  // Health and Social Service Department
  "Bachelor of Science in Counselling Psychotherapy",
  "Bachelor of Community Development",
  "Bachelor of Science in Occupational Health and Safety",
  "Bachelor of Science in Public Health",
  "Bachelor in Public Health",
  "Bachelor of Science in Health Promotion and Disease Prevention",
  "Bachelor of Arts in Human Development and Family Studies",
  "Diploma in Community Development",
  "Diploma in Occupational Health and Safety",
  "Diploma in Public Health",
  "Diploma in Counselling (Trauma)",
  "Diploma in Social Work",
  "Certificate V in Public Health",
  "Certificate V in Health and Safety Management",
  "Certificate V in Counselling",
  "Certificate V in Fire Safety",
  "Certificate V in Social Work",
  "Certificate V in Community Based Work Children and Youth",

  // Department of Engineering, Technical and Vocational Education
  "Bachelor of Civil Engineering Technology in Construction",
  "Bachelor of Science in Geometrics",
  "Diploma in Construction Engineering",
  "Diploma in Water Engineering",
  "Diploma in Motor Vehicle Mechanics",
  "Diploma in Electronics Engineering",
  "Diploma in Agriculture",
  "Certificate V in Poultry Production",
  "Certificate V in Fashion Design",
  "Certificate V in Vegetable Production",
  "Certificate V in Auto Electrics",
  "Certificate V in Borehole Maintenance",

  // Education Department
  "Bachelor of Education in Early Childhood Education",
  "Bachelor of Education in Educational Leadership and Management",
  "Bachelor of Education in Special and Inclusive Education",
  "Diploma in Early Childhood Education",
  "Diploma in Education Management and Administration",
  "Diploma in Educational Leadership and Management",
  "Certificate V in Distance Education",
  "Certificate V in Early Childhood Education",
  "Certificate V in Vocational Education and Training",

  // Professional Programmes (high-level headings)
  "Chartered Institute of Procurement and Supply (CIPS)",
  "Association of Accounting Technicians (AAT)",
];

function main() {
  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));

  const existingKeys = new Set(
    programmes
      .filter((p) => String(p.universityShort || "") === UNIVERSITY_SHORT || String(p.university || "") === UNIVERSITY_NAME)
      .map((p) => `${String(p.name || "").trim().toLowerCase()}|${UNIVERSITY_SHORT}`),
  );

  const toAdd = [];
  for (const name of CONTENTS_PROGRAMMES) {
    const key = `${String(name).trim().toLowerCase()}|${UNIVERSITY_SHORT}`;
    if (existingKeys.has(key)) continue;
    toAdd.push({
      id: `guc-${slugify(name)}`,
      name,
      field: guessField(name),
      university: UNIVERSITY_NAME,
      universityShort: UNIVERSITY_SHORT,
      minPoints: null,
      subjectRequirements: {},
      duration: null,
      durationYears: null,
      description: "Listed in GUC 2025 programmes brochure (docs/2025Programmes_copy.pdf).",
      officialUrl: null,
      applyUrl: null,
      modules: [],
      careers: [],
      applicationDeadline: null,
      minPointsSource: null,
      minPointsTier: null,
      minPointsScaleVersion: 2,
      profileCompleteness: "partial",
      sponsorshipTier: "standard",
    });
  }

  if (!toAdd.length) {
    console.error("GUC ensure: nothing to add (all programmes already present).");
    return;
  }

  fs.writeFileSync(progPath, `${JSON.stringify([...programmes, ...toAdd], null, 2)}\n`);
  console.error(`GUC ensure: added ${toAdd.length} programme(s).`);
}

main();

