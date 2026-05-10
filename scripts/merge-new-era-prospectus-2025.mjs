/**
 * Merge New Era College programme list and published baseline admissions minima into programmes.json.
 *
 * Source: docs/New_Era_College_Prospectus_copy.pdf (prospectus).
 *
 * The prospectus describes faculty-level grade requirements and general points guidance:
 * - Government sponsorship: 36 points across 6 subjects
 * - Self sponsorship: 30 points
 *
 * Thuto stores a single `minPoints`, so we use the self-sponsorship floor (30) as the baseline.
 * Programme-specific requirements should still be verified with the institution.
 *
 * Usage: node scripts/merge-new-era-prospectus-2025.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizePdfText, pdfToText } from "./lib/pdfText.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");
const docsDir = path.join(root, "docs");

const UNIVERSITY_NAME = "New Era College";
const UNIVERSITY_SHORT = "New Era";
const OFFICIAL_URL = "https://www.neweracollege.ac.bw/";

const SELF_SPONSOR_FLOOR = 30;

function findPdf() {
  if (!fs.existsSync(docsDir)) return null;
  const files = fs.readdirSync(docsDir);
  const exact = files.find((f) => /New_Era_College_Prospectus.*\.pdf$/i.test(f));
  return exact ? path.join(docsDir, exact) : null;
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function detectFaculty(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("engineering") || n.includes("civil") || n.includes("telecommunication") || n.includes("mechanical")) {
    return "Engineering";
  }
  if (n.includes("commerce") || n.includes("accounting") || n.includes("marketing") || n.includes("supply chain") || n.includes("logistics") || n.includes("hospital administration") || n.includes("entrepreneurship")) {
    return "Commerce and Industry";
  }
  if (n.includes("cyber security") || n.includes("forensic") || n.includes("geology")) {
    return "Applied Science and Technology";
  }
  if (n.includes("inclusive education") || n.includes("education")) {
    return "Societal and Vocational Education";
  }
  return null;
}

function fieldForProgramme(name, faculty) {
  const n = String(name || "").toLowerCase();
  if (faculty === "Engineering") return "Engineering";
  if (faculty === "Societal and Vocational Education") return "Education";
  if (n.includes("cyber") || n.includes("technology") || n.includes("computer") || n.includes("information")) return "Technology";
  if (n.includes("geology")) return "Natural Sciences";
  if (n.includes("hospital administration")) return "Health";
  if (faculty === "Commerce and Industry") return "Business";
  return "Business";
}

function subjectReqForFaculty(faculty) {
  // From prospectus faculty requirements:
  // - Engineering / Applied Science & Tech: Maths C, Sciences C, English D
  // - Commerce: Maths C, English D
  // - Societal & Vocational Education: English C, Maths D
  if (faculty === "Engineering" || faculty === "Applied Science and Technology") {
    return { math: "C", science: "C", english: "D" };
  }
  if (faculty === "Commerce and Industry") {
    return { math: "C", english: "D" };
  }
  if (faculty === "Societal and Vocational Education") {
    return { english: "C", math: "D" };
  }
  return {};
}

function durationYearsForName(name) {
  const n = String(name || "").toLowerCase();
  if (n.startsWith("certificate")) return 1;
  if (n.startsWith("diploma")) return 3;
  // Prospectus lists BEng as 5 years.
  if (n.includes("bachelor of engineering")) return 5;
  return 4;
}

function parseProgrammeNames(text) {
  // Pull programme names from the "ADMISSIONS AND SELECTION CRITERIA" section where they are listed cleanly.
  const startIdx = text.toLowerCase().indexOf("admissions and");
  const slice = startIdx >= 0 ? text.slice(startIdx) : text;
  const lines = slice.split("\n").map((l) => l.trim()).filter(Boolean);

  const out = [];
  for (const l of lines) {
    if (!/^(Bachelor of|Diploma in|Certificate in)\b/i.test(l)) continue;
    // Ignore narrative lines that happen to start with these words (rare, but defensive).
    if (l.length > 140) continue;
    out.push(l.replace(/\s+/g, " ").trim());
  }

  // De-dupe, preserving order.
  const seen = new Set();
  return out.filter((name) => {
    const k = name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function main() {
  const pdfPath = findPdf();
  if (!pdfPath) {
    console.error("New Era merge: could not find New Era prospectus PDF in docs/.");
    process.exitCode = 1;
    return;
  }

  const raw = normalizePdfText(pdfToText(pdfPath));
  const names = parseProgrammeNames(raw);
  if (!names.length) {
    console.error("New Era merge: did not find programme names in the prospectus extract.");
    process.exitCode = 1;
    return;
  }

  const incoming = names.map((name) => {
    const faculty = detectFaculty(name);
    const field = fieldForProgramme(name, faculty);
    const durationYears = durationYearsForName(name);
    const duration = durationYears === 1 ? "1 year" : `${durationYears} years`;
    return {
      id: `new-era-${slugify(name)}`,
      name,
      field,
      university: UNIVERSITY_NAME,
      universityShort: UNIVERSITY_SHORT,
      faculty: faculty ?? undefined,
      minPoints: SELF_SPONSOR_FLOOR,
      subjectRequirements: subjectReqForFaculty(faculty),
      duration,
      durationYears,
      description:
        "Programme at New Era College. Baseline points and faculty requirements are taken from the prospectus; confirm programme-specific requirements and sponsorship thresholds with the institution.",
      officialUrl: OFFICIAL_URL,
      applyUrl: OFFICIAL_URL,
      modules: [],
      careers: [],
      applicationDeadline: null,
      minPointsSource: "New Era College prospectus — admissions & selection criteria (self sponsorship: 30 points; faculty requirements).",
      minPointsTier: "institution_minimum",
      minPointsScaleVersion: 2,
      profileCompleteness: "partial",
      sponsorshipTier: "standard",
    };
  });

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const kept = programmes.filter(
    (p) => String(p.university || "") !== UNIVERSITY_NAME && String(p.universityShort || "") !== UNIVERSITY_SHORT,
  );

  fs.writeFileSync(progPath, `${JSON.stringify([...kept, ...incoming], null, 2)}\n`);
  console.error(`New Era merge: wrote ${incoming.length} programmes (replaced existing New Era rows).`);
}

main();

