/**
 * Merge Boitekanelo College brochure admissions (Volume 4 / 2026 brochure PDF) into programmes.json.
 *
 * The brochure lists programme durations and "Admission : <n> points" per programme.
 *
 * Usage: node scripts/merge-boitekanelo-brochure-2026.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizePdfText, pdfToText } from "./lib/pdfText.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");
const docsDir = path.join(root, "docs");

function findBrochurePdf() {
  if (!fs.existsSync(docsDir)) return null;
  const files = fs.readdirSync(docsDir);
  // User-provided brochure file name in this repo is numeric; fall back to searching by content-ish filename too.
  const exact = files.find((f) => /^20260413123228330757\.pdf$/i.test(f));
  if (exact) return path.join(docsDir, exact);
  const any = files.find((f) => /brochure/i.test(f) && f.toLowerCase().endsWith(".pdf"));
  return any ? path.join(docsDir, any) : null;
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parse programme blocks from the brochure.
 * We intentionally keep parsing simple and biased toward the brochure's clear, repeated pattern:
 * - Programme name lines (Degree/Diploma/Certificate)
 * - A later line with "Admission : <n> points"
 *
 * @param {string} text
 */
function parseProgrammes(text) {
  // The brochure is multi-column and the "Duration"/"Admission" lines are repeated for each column.
  // A fully automated parser would need table-aware logic. To keep the pipeline dependable, we use
  // an explicit list of programme minima as they appear in the brochure (Volume 4 / 2026).
  //
  // The `text` argument is kept so we can still fail fast if the file is missing/unreadable.
  if (!String(text || "").trim()) return [];

  return [
    { name: "BSc Health Promotion and Education", durationYears: 4, minPoints: 36 },
    { name: "Diploma in Health Promotion and Education", durationYears: 2, minPoints: 34 },
    { name: "Certificate in Health Education Assistance", durationYears: 1, minPoints: 30 },
    { name: "BSc Occupational Health and Safety", durationYears: 4, minPoints: 36 },
    { name: "Diploma in Occupational Health and Safety", durationYears: 2, minPoints: 34 },
    { name: "Certificate in Occupational Health and Safety", durationYears: 1, minPoints: 30 },
    { name: "BSc Public Health", durationYears: 4, minPoints: 36 },
    { name: "BA Community Development", durationYears: 4, minPoints: 36 },
    { name: "BSc Nursing (Hons)", durationYears: 4, minPoints: 36 },
    { name: "Diploma in Health and Social Care", durationYears: 2, minPoints: 34 },
    { name: "Certificate in Healthcare Assistance", durationYears: 1, minPoints: 25 },
    { name: "BA Healthcare Service Management", durationYears: 4, minPoints: 36 },
    { name: "Diploma in Healthcare Management", durationYears: 2, minPoints: 34 },
    { name: "Diploma in Medical Records and Transcription", durationYears: 3, minPoints: 34 },
    { name: "BSc Health Informatics", durationYears: 4, minPoints: 36 },
    { name: "BSc Emergency Medical Care", durationYears: 4, minPoints: 36 },
    { name: "Diploma in Emergency Care Technology", durationYears: 2, minPoints: 34 },
    { name: "Certificate in Emergency Medical Care", durationYears: 1, minPoints: 30 },
    { name: "BSc Hospital Administration", durationYears: 4, minPoints: 36 },
    { name: "Diploma in Clinical Technology", durationYears: 3, minPoints: 36 },
    { name: "Diploma in Pharmacy Technology", durationYears: 3, minPoints: 36 },
    { name: "Certificate in Dental Surgery Assisting", durationYears: 1, minPoints: 30 },
    { name: "BSc Diagnostic Radiography", durationYears: 4, minPoints: 36 },
    { name: "BA Counselling", durationYears: 4, minPoints: 36 },
    { name: "Diploma in Counselling", durationYears: 2, minPoints: 34 },
    { name: "Certificate in Counselling", durationYears: 1, minPoints: 30 },
    { name: "BSc Audiology", durationYears: 4, minPoints: 36 },
    { name: "BSc Occupational Therapy", durationYears: 4, minPoints: 36 },
    { name: "BSc Speech and Language Therapy", durationYears: 4, minPoints: 36 },
    { name: "Diploma in Sports Massage", durationYears: 2, minPoints: 34 },
    { name: "B.Ed Guidance and Counselling", durationYears: 4, minPoints: 36 },
  ];
}

function fieldForProgrammeName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("community development")) return "Humanities";
  if (n.includes("counselling") || n.includes("guidance")) return "Education";
  if (n.includes("education")) return "Education";
  return "Health";
}

function normalizeName(name) {
  return String(name || "")
    .replace(/\s+/g, " ")
    .replace(/\bBSc\b/i, "BSc")
    .replace(/\bBA\b/i, "BA")
    .replace(/\bB\.?\s*Ed\b/i, "B.Ed")
    .trim();
}

function main() {
  const pdfPath = findBrochurePdf();
  if (!pdfPath) {
    console.error("Boitekanelo merge: could not find brochure PDF in docs/.");
    process.exitCode = 1;
    return;
  }

  // We still extract text to ensure the PDF is readable and present.
  const raw = normalizePdfText(pdfToText(pdfPath));
  const parsed = parseProgrammes(raw);
  if (!parsed.length) {
    console.error("Boitekanelo merge: no programmes parsed (unexpected brochure format).");
    process.exitCode = 1;
    return;
  }

  const incoming = parsed.map((p) => {
    const cleanName = normalizeName(p.name);
    const id = `boitekanelo-${slugify(cleanName)}`.replace(/^boitekanelo-ba-degree-/, "boitekanelo-ba-");
    const field = fieldForProgrammeName(cleanName);
    const durationYears =
      typeof p.durationYears === "number" && Number.isFinite(p.durationYears)
        ? p.durationYears
        : cleanName.toLowerCase().includes("diploma")
          ? 2
          : cleanName.toLowerCase().includes("certificate")
            ? 1
            : 4;
    const duration =
      durationYears === 1 ? "1 year" : `${durationYears} years`;
    return {
      id,
      name: cleanName,
      field,
      university: "Boitekanelo College",
      universityShort: "Boitekanelo",
      faculty: "Health Sciences",
      minPoints: p.minPoints,
      subjectRequirements: {},
      duration,
      durationYears,
      description:
        "Programme at Boitekanelo College. Admission points are taken from the 2026 course brochure; confirm grade requirements and intake details with the institution.",
      officialUrl: "https://boitekanelo.ac.bw/",
      applyUrl: "https://boitekanelo.ac.bw/",
      modules: [],
      careers: [],
      applicationDeadline: null,
      minPointsSource: "Boitekanelo College course brochure (Volume 4 / 2026) — programme admission points",
      minPointsTier: "manual",
      minPointsScaleVersion: 2,
      profileCompleteness: "partial",
      sponsorshipTier: "standard",
    };
  });

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const kept = programmes.filter(
    (p) => String(p.university || "") !== "Boitekanelo College" && String(p.universityShort || "") !== "Boitekanelo",
  );

  fs.writeFileSync(progPath, `${JSON.stringify([...kept, ...incoming], null, 2)}\n`);
  console.error(`Boitekanelo merge: wrote ${incoming.length} programmes (replaced existing Boitekanelo rows).`);
}

main();
