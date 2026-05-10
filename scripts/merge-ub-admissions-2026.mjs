/**
 * Merges UB 2026 undergraduate admissions guide data into public/data/programmes.json.
 *
 * Source PDF (checked into /docs by the user):
 * - A-GUIDE_TO-PROSPECTIVE-APPLICANTS-2026-UNDEGRADUATE-14042026*.pdf
 *
 * The guide contains:
 * - Overall Points (Best 6 Subjects)
 * - (Optional) Programme Points options for competitive programmes
 *
 * Usage: node scripts/merge-ub-admissions-2026.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizePdfText, pdfToText } from "./lib/pdfText.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");
const docsDir = path.join(root, "docs");

/** UB 2026 general minima (NCQF Level 4 / school-leaving route), best six. */
const UB_DEGREE_FLOOR = 34;
const UB_DIPLOMA_CERT_FLOOR = 30;

function canonicalName(s) {
  let t = String(s || "").toLowerCase();
  t = t.replace(/&/g, " and ");
  // Expand common abbreviations used in programmes.json so they match the guide wording.
  t = t.replace(/\bb\.?\s*sc\b/g, "bachelor of science");
  t = t.replace(/\bbsc\b/g, "bachelor of science");
  t = t.replace(/\bb\.?\s*a\b/g, "bachelor of arts");
  t = t.replace(/\bba\b/g, "bachelor of arts");
  t = t.replace(/\bb\.?\s*ed\b/g, "bachelor of education");
  t = t.replace(/\bbed\b/g, "bachelor of education");
  t = t.replace(/\bb\.?\s*eng\b/g, "bachelor of engineering");
  t = t.replace(/\bbeng\b/g, "bachelor of engineering");
  t = t.replace(/\bb\.?\s*com\b/g, "bachelor of commerce");
  t = t.replace(/\bbcom\b/g, "bachelor of commerce");
  t = t.replace(/\bbba\b/g, "bachelor of business administration");
  // Normalise punctuation/spacing and drop common filler words.
  t = t.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  const stop = new Set([
    "in",
    "degree",
    "programme",
    "program",
    "programmes",
    "programs",
    "study",
    "revised",
    "administration",
    "honours",
    "hons",
    "bis",
    "llb",
    "b",
    "psych",
  ]);
  t = t
    .split(" ")
    .filter((w) => w && !stop.has(w))
    .join(" ");
  return t;
}

function findUbGuidePdf() {
  if (!fs.existsSync(docsDir)) return null;
  const files = fs.readdirSync(docsDir);
  const match = files.find((f) => /A-GUIDE[_-]?TO[_-]?PROSPECTIVE[_-]?APPLICANTS[_-]?2026.*\.pdf$/i.test(f));
  return match ? path.join(docsDir, match) : null;
}

function letterGrade(raw) {
  if (!raw) return null;
  const u = String(raw).toUpperCase().replace(/\*/g, "");
  return u.startsWith("A") ? "A" : u[0] || null;
}

function specToRequirements(specText) {
  const req = {};
  const t = String(specText || "");
  const lower = t.toLowerCase();

  const both = lower.match(/minimum of grade\s+([a-z*]+)\s+in\s+english language and mathematics/i);
  if (both) {
    const g = letterGrade(both[1]);
    if (g) {
      req.english = g;
      req.math = g;
    }
  }

  if (!req.english) {
    const m = lower.match(/minimum of grade\s+([a-z*]+)\s+in\s+english language/i);
    if (m) req.english = letterGrade(m[1]);
  }
  if (!req.math) {
    const m = lower.match(/minimum of grade\s+([a-z*]+)\s+in\s+mathematics/i);
    if (m) req.math = letterGrade(m[1]);
  }

  // Broad science requirement heuristic (kept conservative).
  if (!req.science && /biology|chemistry|physics|science double|pure sciences|science subject/i.test(lower)) {
    const m = lower.match(/grades?\s+of\s+([a-z*])\s+in\s+any\s+two/i);
    if (m) req.science = letterGrade(m[1]);
    else if (/grade\s+c/i.test(lower)) req.science = "C";
  }
  return req;
}

function parseGuideBlocks(text) {
  const lines = String(text || "").split("\n");
  /** @type {number[]} */
  const starts = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const name = (lines[i] || "").trim();
    const next = (lines[i + 1] || "").trim();
    if (!name) continue;
    if (!/^Duration:\s*/i.test(next)) continue;
    if (/^www\.ub\.bw\b/i.test(name)) continue;
    if (/^A GUIDE TO PROSPECTIVE APPLICANTS/i.test(name)) continue;
    if (/^\d+$/.test(name)) continue;
    starts.push(i);
  }

  /** @type {Array<{ name: string, overall: number, specText: string, programmePoints: string[] }>} */
  const out = [];
  for (let si = 0; si < starts.length; si++) {
    const i = starts[si];
    const end = si + 1 < starts.length ? starts[si + 1] : lines.length;
    const blockLines = lines.slice(i, end).map((l) => l.trimEnd());
    const block = blockLines.join("\n");

    const overallMatch = block.match(/Overall Points \(Best 6 Subjects\):\s*(\d+)/i);
    if (!overallMatch) continue;
    const overall = Number(overallMatch[1]);
    if (!Number.isFinite(overall)) continue;

    const specIdx = blockLines.findIndex((l) => /^Specific Entry Requirements/i.test(l.trim()));
    const appIdx = blockLines.findIndex((l) => /^Application Cut-?off points/i.test(l.trim()));
    if (specIdx < 0 || appIdx < 0 || appIdx <= specIdx) continue;

    const name = (blockLines[0] || "").trim();
    const specText = blockLines.slice(specIdx + 1, appIdx).join("\n").trim();

    const ppIdx = blockLines.findIndex((l) => /^Programme Points\b/i.test(l.trim()));
    const programmePoints = [];
    if (ppIdx >= 0) {
      for (let k = ppIdx + 1; k < blockLines.length; k++) {
        const ln = (blockLines[k] || "").trim();
        if (!ln) break;
        if (/^www\.ub\.bw\b/i.test(ln)) break;
        if (/^\d+$/.test(ln)) continue;
        if (/^A GUIDE TO PROSPECTIVE APPLICANTS/i.test(ln)) break;
        programmePoints.push(ln);
      }
    }

    out.push({ name, overall, specText, programmePoints });
  }
  return out;
}

function isUbProgramme(p) {
  const uni = String(p?.university || "");
  const short = String(p?.universityShort || "");
  const id = String(p?.id || "");
  return uni === "University of Botswana" || short === "UB" || id.startsWith("ub-");
}

function mergeRequirementObjects(a, b) {
  return { ...(a || {}), ...(b || {}) };
}

function main() {
  const pdfPath = findUbGuidePdf();
  if (!pdfPath) {
    console.error("UB 2026 merge: could not find UB 2026 guide PDF in docs/.");
    process.exitCode = 1;
    return;
  }

  const guideRaw = normalizePdfText(pdfToText(pdfPath));
  const blocks = parseGuideBlocks(guideRaw);
  const byKey = new Map();
  for (const b of blocks) {
    const k = canonicalName(b.name);
    if (k && !byKey.has(k)) byKey.set(k, b);
  }

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  let updated = 0;
  let matched = 0;
  let floorApplied = 0;

  for (const p of programmes) {
    if (!isUbProgramme(p)) continue;
    if (/post\s*graduate/i.test(String(p.name || ""))) continue;

    const k = canonicalName(p.name);
    const block = byKey.get(k);

    if (block) {
      const req = specToRequirements(block.specText);
      p.minPoints = block.overall;
      if (Object.keys(req).length) {
        p.subjectRequirements = mergeRequirementObjects(p.subjectRequirements, req);
      }
      if (block.programmePoints?.length) {
        p.programmePoints = block.programmePoints;
      } else {
        delete p.programmePoints;
      }
      p.minPointsSource = "UB 2026 prospective applicants guide (application cut-off overall, best 6)";
      p.minPointsTier = "guide_overall";
      p.minPointsScaleVersion = 2;
      matched++;
      updated++;
      continue;
    }

    const dy = p.durationYears;
    const isDiplomaOrCert =
      dy === 2 ||
      dy === 1 ||
      /diploma|certificate/i.test(String(p.name || "")) ||
      /post\s*graduate/i.test(String(p.name || ""));

    p.minPoints = isDiplomaOrCert ? UB_DIPLOMA_CERT_FLOOR : UB_DEGREE_FLOOR;
    p.minPointsSource =
      "UB 2026 prospective applicants guide — general minimum (best 6) applied because programme block was not matched in the local PDF extract";
    p.minPointsTier = "institution_minimum";
    p.minPointsScaleVersion = 2;
    delete p.programmePoints;
    updated++;
    floorApplied++;
  }

  fs.writeFileSync(progPath, `${JSON.stringify(programmes, null, 2)}\n`);
  console.error(`UB admissions 2026 merge: updated ${updated} programmes (${matched} matched blocks; ${floorApplied} floor defaults).`);
  console.error(`Guide blocks parsed: ${blocks.length}.`);
}

main();
