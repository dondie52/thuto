/**
 * Merge Gaborone University College (GUC) programmes into public/data/programmes.json.
 *
 * Source: docs/2025Programmes_copy.pdf
 *
 * Note: If the PDF is a scanned document (images), `pdftotext` may return empty output.
 * In that case, this script will stop with guidance to OCR the PDF first.
 *
 * Usage: node scripts/merge-guc-programmes-2025.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizePdfText, pdfToText } from "./lib/pdfText.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");
const pdfPath = path.join(root, "docs", "2025Programmes_copy.pdf");

const UNIVERSITY_NAME = "Gaborone University College (GUC)";
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
  if (n.includes("nursing") || n.includes("health") || n.includes("pharmacy") || n.includes("laboratory")) return "Health";
  if (n.includes("education") || n.includes("teaching")) return "Education";
  if (n.includes("engineering")) return "Engineering";
  if (n.includes("computer") || n.includes("information") || n.includes("ict") || n.includes("software")) return "Technology";
  if (n.includes("account") || n.includes("business") || n.includes("finance") || n.includes("marketing") || n.includes("management")) return "Business";
  return "Humanities";
}

function parseProgrammeNames(text) {
  // Heuristic: pick reasonably short lines that look like programme titles.
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const out = [];
  for (const l of lines) {
    if (l.length < 6 || l.length > 120) continue;
    if (!/^(Bachelor|BSc|BA|BCom|Diploma|Higher Diploma|Certificate)\b/i.test(l)) continue;
    // Skip obvious headers.
    if (/programme|programmes|faculty|department|campus|requirements|admission/i.test(l) && l.split(" ").length <= 3)
      continue;
    out.push(l);
  }

  const seen = new Set();
  return out.filter((name) => {
    const k = name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function main() {
  if (!fs.existsSync(pdfPath)) {
    console.error(`GUC merge: missing source PDF: ${pdfPath}`);
    process.exitCode = 1;
    return;
  }

  const raw = normalizePdfText(pdfToText(pdfPath, { layout: true }));
  if (!raw || raw.length < 50) {
    console.error("GUC merge: PDF text extraction returned empty/too small output.");
    console.error("If this is a scanned PDF, OCR it first (e.g. with ocrmypdf), then re-run this script.");
    process.exitCode = 1;
    return;
  }

  const names = parseProgrammeNames(raw);
  if (!names.length) {
    console.error("GUC merge: did not find programme names in extracted text.");
    process.exitCode = 1;
    return;
  }

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const kept = programmes.filter((p) => String(p.university || "") !== UNIVERSITY_NAME);

  const incoming = names.map((name) => ({
    id: `guc-${slugify(name)}`,
    name,
    field: guessField(name),
    university: UNIVERSITY_NAME,
    universityShort: UNIVERSITY_SHORT,
    minPoints: null,
    subjectRequirements: {},
    duration: null,
    durationYears: null,
    description:
      "Programme at Gaborone University College (GUC). Programme list extracted from an institution document; confirm entry requirements, duration, and modules with the institution.",
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
  }));

  fs.writeFileSync(progPath, `${JSON.stringify([...kept, ...incoming], null, 2)}\n`);
  console.error(`GUC merge: wrote ${incoming.length} programmes (replaced existing rows).`);
}

main();

