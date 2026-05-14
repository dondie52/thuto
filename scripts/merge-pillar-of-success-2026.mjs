/**
 * Merge Pillar of Success Training Institute programmes (from 2026 poster) into public/data/programmes.json.
 *
 * Usage: node scripts/merge-pillar-of-success-2026.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");

const UNIVERSITY_NAME = "Pillar of Success Training Institute";
const UNIVERSITY_SHORT = "Pillar of Success";

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function fieldForCategory(category) {
  switch (category) {
    case "Health":
      return "Health";
    case "Education":
      return "Education";
    case "Management and Business Studies":
      return "Business";
    case "IT and Computer Studies":
      return "Technology";
    case "Humanities and Social Sciences":
      return "Humanities";
    case "Consultancy":
      return "Business";
    default:
      return "Business";
  }
}

function durationYearsFromDuration(duration) {
  const d = String(duration || "").toLowerCase().trim();
  const m = d.match(/^(\d+)\s*year/);
  if (m) return Number(m[1]);
  return null;
}

const PROGRAMMES = [
  // 1. Health
  ["Health", "Health Care Assistant", "1 year"],
  ["Health", "Health Care Assistant", "6 months"],
  ["Health", "Laboratory Phlebotomy", "6 months"],
  ["Health", "Pharmacy Assistant", "6 months"],
  ["Health", "Occupational Health and Safety", "6 months"],
  ["Health", "Advanced Basic Life Support", "6 months"],
  ["Health", "Clinical Psychology and Counselling", "6 months"],
  ["Health", "Health Care Assistant Clinical Skills", "2 months"],
  ["Health", "Medical Records and Archives", "6 months"],
  ["Health", "Medical Billing and Coding", "6 months"],
  ["Health", "Health, Safety and First Aid", "2 months"],
  ["Health", "HIV Counselling and Testing", "2 months"],
  ["Health", "Psychosocial Counselling", "2 months"],
  ["Health", "Infection Control and Basic First Aid", "2 weeks"],
  ["Health", "Phlebotomy and IV Cannulation", "10 days"],
  ["Health", "Basic First Aid", "5 days"],
  ["Health", "First Aid and Emergency", "5 days"],

  // 2. Education
  ["Education", "Special Needs and Inclusive Education", "6 months"],
  ["Education", "Early Childhood Education", "6 months"],
  ["Education", "Sign Language", "6 months"],
  ["Education", "Educational Psychology", "6 months"],
  ["Education", "Educational Management in Early Childhood", "6 months"],
  ["Education", "Teaching Methodology and Lecturing Skills", "6 months"],
  ["Education", "Assessor and Moderator", "2 months"],
  ["Education", "Trainer of Trainers", "1 month"],
  ["Education", "IELTS", "2 months"],

  // 3. Management and Business Studies
  ["Management and Business Studies", "Business Management and Administrative", "6 months"],
  ["Management and Business Studies", "Human Resource Management", "6 months"],
  ["Management and Business Studies", "Project Management", "6 months"],
  ["Management and Business Studies", "Leadership and Management", "6 months"],
  ["Management and Business Studies", "Customer Service and Supervisory Management", "6 months"],
  ["Management and Business Studies", "Insurance Law and Asset Management", "6 months"],
  ["Management and Business Studies", "Public Relations and Marketing", "6 months"],
  ["Management and Business Studies", "Secretarial and Administration", "6 months"],
  ["Management and Business Studies", "Risk Management and Money Laundering", "3 months"],
  ["Management and Business Studies", "Risk and Security Management", "6 months"],
  ["Management and Business Studies", "Security Management and Crime Detective", "6 months"],
  ["Management and Business Studies", "Company Secretary and Consultancy", "3 months"],
  ["Management and Business Studies", "Security Management and Crime Detection", "3 months"],
  ["Management and Business Studies", "Good Governance and Emotional Intelligence", "5 days"],

  // 4. IT and Computer Studies
  ["IT and Computer Studies", "Computer Studies and Information Technology", "6 months"],
  ["IT and Computer Studies", "Fire Safety Engineering", "6 months"],
  ["IT and Computer Studies", "Fire Marshal", "2 months"],

  // 5. Humanities and Social Sciences
  ["Humanities and Social Sciences", "Forensic Psychology and Criminology", "6 months"],
  ["Humanities and Social Sciences", "Diplomacy, Conflict Resolution and Peace Building", "2 months"],
  ["Humanities and Social Sciences", "Diplomatic Protocol, Etiquette and International Relations", "2 months"],

  // 6. Consultancy
  ["Consultancy", "Research Proposal Writing", "2 weeks"],
  ["Consultancy", "Thesis/Dissertation Writing", "1 month"],
  ["Consultancy", "Workshops", null],
  ["Consultancy", "Trainings", null],
];

function main() {
  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const kept = programmes.filter((p) => String(p.university || "") !== UNIVERSITY_NAME);

  const incoming = PROGRAMMES.map(([category, name, duration]) => {
    const field = fieldForCategory(category);
    const dur = duration ?? null;
    const durationYears = durationYearsFromDuration(dur);
    return {
      id: `pillar-of-success-${slugify(`${name}-${dur || "course"}`)}`,
      name,
      field,
      university: UNIVERSITY_NAME,
      universityShort: UNIVERSITY_SHORT,
      faculty: category,
      minPoints: null,
      subjectRequirements: {},
      duration: dur,
      durationYears,
      description:
        "Programme or short course offered by Pillar of Success Training Institute. Confirm fees, intake dates, and any entry requirements with the institution.",
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
    };
  });

  fs.writeFileSync(progPath, `${JSON.stringify([...kept, ...incoming], null, 2)}\n`);
  console.error(`Pillar of Success merge: wrote ${incoming.length} programmes (replaced existing rows).`);
}

main();

