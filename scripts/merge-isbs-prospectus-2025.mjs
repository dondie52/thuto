/**
 * Merge Imperial School of Business and Science (ISBS) programme list into programmes.json
 * and ensure ISBS exists in universities.json.
 *
 * Source: ISBS prospectus PDF (committed by the user; script searches repo root and /docs).
 *
 * ISBS prospectus describes entry requirements as "Best 6 subjects with a pass in English and Mathematics"
 * without publishing a numeric points cut-off. Thuto therefore leaves `minPoints` as null.
 *
 * Usage: node scripts/merge-isbs-prospectus-2025.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizePdfText, pdfToText } from "./lib/pdfText.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");
const uniPath = path.join(root, "public/data/universities.json");

function findPdf() {
  const candidates = [];
  for (const dir of [root, path.join(root, "docs")]) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    const match = files.find((f) => /ISBS.*Prospectus.*\.pdf$/i.test(f));
    if (match) candidates.push(path.join(dir, match));
  }
  return candidates[0] ?? null;
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseProgrammeLists(text) {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  function readList(afterHeadingRegex, stopHeadingRegex, itemRegex) {
    const start = lines.findIndex((l) => afterHeadingRegex.test(l));
    if (start < 0) return [];
    const out = [];
    for (let i = start + 1; i < lines.length; i++) {
      const l = lines[i];
      if (stopHeadingRegex.test(l)) break;
      if (!itemRegex.test(l)) continue;
      out.push(l);
    }
    return out;
  }

  // Post Graduate and Undergraduate Programmes list (the clean list we want).
  const pgStart = lines.findIndex((l) => /^Programmes$/i.test(l));
  const bachelors = [];
  if (pgStart >= 0) {
    for (let i = pgStart + 1; i < Math.min(lines.length, pgStart + 40); i++) {
      const l = lines[i];
      if (/^\d+$/.test(l)) break;
      if (/^Entry Requirements$/i.test(l)) break;
      if (!/^(Post Graduate Diploma|Bachelor of)\b/i.test(l)) continue;
      bachelors.push(l);
    }
  }

  // Diploma/certificate lists near the front of the PDF.
  const diplomas = readList(
    /^Diploma \(Level-6\) Programmes$/i,
    /^Certificate \(Level-5\) Programmes$/i,
    /^Diploma in\b/i,
  );
  const certificates = readList(
    /^Certificate \(Level-5\) Programmes$/i,
    /^Corporate Trainings$/i,
    /^Certificate\b/i,
  );

  function stitchContinuations(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const cur = list[i];
      const next = list[i + 1];
      if (next && /^(Transport Management|Management)$/i.test(next) && /\band\b$/i.test(cur)) {
        out.push(`${cur} ${next}`.replace(/\s+/g, " ").trim());
        i++;
        continue;
      }
      out.push(cur);
    }
    // De-dupe.
    const seen = new Set();
    return out.filter((x) => {
      const k = x.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  return {
    bachelors: stitchContinuations(bachelors),
    diplomas: stitchContinuations(diplomas),
    certificates: stitchContinuations(certificates),
  };
}

function fieldForName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("public health") || n.includes("occupational health")) return "Health";
  return "Business";
}

function durationYearsForName(name) {
  const n = String(name || "").toLowerCase();
  if (n.startsWith("post graduate diploma")) return 1;
  if (n.startsWith("diploma")) return 2;
  if (n.startsWith("certificate")) return 1;
  return 4;
}

function buildProgrammeRows(names) {
  const rows = [];
  for (const name of names) {
    const clean = name.replace(/\s+/g, " ").trim();
    rows.push({
      id: `isbs-${slugify(clean)}`,
      name: clean,
      field: fieldForName(clean),
      university: "Imperial School of Business and Science",
      universityShort: "ISBS",
      minPoints: null,
      subjectRequirements: {},
      duration: `${durationYearsForName(clean)} years`,
      durationYears: durationYearsForName(clean),
      description:
        "Programme at Imperial School of Business and Science (ISBS). The prospectus lists entry requirements as best-six passes in English and Mathematics; confirm programme-specific requirements with the institution.",
      officialUrl: "https://www.isbs.ac.bw/",
      applyUrl: "https://www.isbs.ac.bw/",
      modules: [],
      careers: [],
      applicationDeadline: null,
      minPointsSource: "ISBS prospectus 2025 — entry requirements described as best-six passes (no numeric points cut-off listed).",
      minPointsTier: "manual",
      minPointsScaleVersion: 2,
      profileCompleteness: "partial",
      sponsorshipTier: "standard",
    });
  }
  return rows;
}

function ensureUniversityEntry() {
  const list = JSON.parse(fs.readFileSync(uniPath, "utf8"));
  const exists = list.some((u) => u?.id === "isbs");
  if (exists) return false;
  list.push({
    id: "isbs",
    name: "Imperial School of Business and Science",
    location: "Gaborone",
    description:
      "Private tertiary provider offering business and science programmes, including professional accounting pathways and vocational certificates.",
    website: "https://www.isbs.ac.bw/",
    phone: "+267 319 0810",
    applicationOpen: null,
    applicationClose: null,
    academicYearStart: null,
    applyUrl: "https://www.isbs.ac.bw/",
    featured: false,
    sponsorshipTier: "standard",
  });
  fs.writeFileSync(uniPath, `${JSON.stringify(list, null, 2)}\n`);
  return true;
}

function main() {
  const pdfPath = findPdf();
  if (!pdfPath) {
    console.error("ISBS merge: could not find ISBS prospectus PDF in repo root.");
    process.exitCode = 1;
    return;
  }

  const raw = normalizePdfText(pdfToText(pdfPath));
  const lists = parseProgrammeLists(raw);
  const allNames = [...lists.bachelors, ...lists.diplomas, ...lists.certificates].filter(Boolean);
  if (!allNames.length) {
    console.error("ISBS merge: no programme names found in the prospectus extract.");
    process.exitCode = 1;
    return;
  }

  const incoming = buildProgrammeRows(allNames);

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const kept = programmes.filter(
    (p) =>
      String(p.university || "") !== "Imperial School of Business and Science" &&
      String(p.universityShort || "") !== "ISBS",
  );
  fs.writeFileSync(progPath, `${JSON.stringify([...kept, ...incoming], null, 2)}\n`);

  const uniAdded = ensureUniversityEntry();
  console.error(
    `ISBS merge: wrote ${incoming.length} programmes (replaced existing ISBS rows); university entry ${
      uniAdded ? "added" : "already present"
    }.`,
  );
}

main();
