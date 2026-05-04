/**
 * Merges UB 2025 undergraduate admissions guide data into public/data/programmes.json.
 *
 * Source text: scripts/data/ub-prospective-applicants-2025-admissions.txt
 * (export from UB PDF "A Guide to Prospective Applicants 2025").
 *
 * Usage: node scripts/merge-ub-admissions-2025.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");
const guidePath = path.join(__dirname, "data/ub-prospective-applicants-2025-admissions.txt");

/** UB 2025 general minima (Certificate IV / NCQF Level 4 pathway), best six. */
const UB_DEGREE_FLOOR = 34;
const UB_DIPLOMA_CERT_FLOOR = 30;

function normName(s) {
  return String(s)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseGuideBlocks(text) {
  const nextProg = "(?:BACHELOR|DIPLOMA IN|POST GRADUATE|CERTIFICATE IN)";
  const pattern = new RegExp(
    `(?:^|\\n)((?:${nextProg})[\\s\\S]+?)\\nDuration \\(Years\\):[^\\n]*\\s*\\nSpecific Entry Requirements:?\\s*((?:(?!\\n${nextProg})[\\s\\S])*?)Application Cut-Off Points\\s*\\nOverall Points \\(Best 6 Subjects\\):\\s*(\\d+)`,
    "g",
  );
  const rows = [];
  for (const m of text.matchAll(pattern)) {
    const overall = Number(m[3]);
    if (!Number.isFinite(overall)) continue;
    rows.push({
      title: m[1].replace(/\s+/g, " ").trim(),
      specText: m[2],
      overall,
    });
  }
  return rows;
}

function letterGrade(raw) {
  if (!raw) return null;
  const u = String(raw).toUpperCase().replace(/\*/g, "");
  return u.startsWith("A") ? "A" : u[0] || null;
}

function specToRequirements(specText) {
  const req = {};
  const t = specText.toLowerCase();
  const both = t.match(/minimum of grade\s+([a-z*]+)\s+in\s+english language and mathematics/i);
  if (both) {
    const g = letterGrade(both[1]);
    if (g) {
      req.english = g;
      req.math = g;
    }
  }
  if (!req.english) {
    const g1 = t.match(/grade\s+([a-z*]+)\s+in\s+english language/i);
    if (g1) req.english = letterGrade(g1[1]);
  }
  if (!req.math) {
    const g2 = t.match(/grade\s+([a-z*]+)\s+in\s+mathematics/i);
    if (g2) req.math = letterGrade(g2[1]);
  }
  if (!req.english) {
    const g3 = t.match(/english language[^.\n]{0,80}grade\s+([a-z*]+)/i);
    if (g3) req.english = letterGrade(g3[1]);
  }
  if (!req.math && /mathematics/i.test(specText)) {
    const g4 = t.match(/mathematics[^.\n]{0,80}grade\s+([a-z*]+)/i);
    if (g4) req.math = letterGrade(g4[1]);
  }
  if (/biology|chemistry|physics|science double|pure sciences|science subject/i.test(t) && /grade\s+c/i.test(t)) {
    if (!req.science) req.science = "C";
  }
  return req;
}

function mergeRequirementObjects(a, b) {
  return { ...a, ...b };
}

function main() {
  const guideRaw = fs.readFileSync(guidePath, "utf8");
  const blocks = parseGuideBlocks(guideRaw);
  const byNorm = new Map();
  for (const b of blocks) {
    const k = normName(b.title);
    if (!byNorm.has(k)) byNorm.set(k, b);
  }

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  let updated = 0;
  const unmatched = [];

  for (const p of programmes) {
    if (p.university !== "University of Botswana") continue;
    const alreadyCurated =
      typeof p.minPoints === "number" &&
      Number.isFinite(p.minPoints) &&
      p.minPointsTier !== "institution_minimum" &&
      !p.minPointsSource?.includes("institution_minimum");
    if (alreadyCurated) continue;
    if (p.id === "ub-post-graduate-diploma-education") continue;

    const dy = p.durationYears;
    const isDiplomaOrCert =
      dy === 2 ||
      dy === 1 ||
      /diploma|certificate/i.test(p.name) ||
      /post\s*graduate/i.test(p.name);

    const nk = normName(p.name);
    const block = byNorm.get(nk);
    if (block) {
      const req = specToRequirements(block.specText);
      p.minPoints = block.overall;
      if (Object.keys(req).length) {
        p.subjectRequirements = mergeRequirementObjects(p.subjectRequirements || {}, req);
      }
      p.minPointsSource = "UB 2025 prospective applicants guide (application cut-off overall, best 6)";
      p.minPointsTier = "guide_overall";
      updated++;
      continue;
    }

    unmatched.push(p.name);

    if (/post\s*graduate|postgraduate/i.test(p.name)) continue;

    p.minPoints = isDiplomaOrCert ? UB_DIPLOMA_CERT_FLOOR : UB_DEGREE_FLOOR;
    p.minPointsSource =
      "UB 2025 prospective applicants guide — general minimum (§General Entry f): 34 degree / 30 diploma-certificate, best 6; programme-specific guide line not matched in local extract";
    p.minPointsTier = "institution_minimum";

    if (!p.subjectRequirements || Object.keys(p.subjectRequirements).length === 0) {
      const scienceFields = new Set(["Natural Sciences", "Health", "Engineering"]);
      const tech = p.field === "Technology";
      const sci = scienceFields.has(p.field) || tech;
      if (sci) {
        p.subjectRequirements = mergeRequirementObjects(p.subjectRequirements || {}, {
          english: "D",
          math: "C",
          science: "C",
        });
      } else {
        p.subjectRequirements = mergeRequirementObjects(p.subjectRequirements || {}, { english: "C" });
      }
    }
    updated++;
  }

  fs.writeFileSync(progPath, `${JSON.stringify(programmes, null, 2)}\n`);
  console.error(`UB admissions merge: updated ${updated} programmes.`);
  console.error(`Guide blocks parsed: ${blocks.length}. Unmatched names (got institution default): ${unmatched.length}`);
}

main();
