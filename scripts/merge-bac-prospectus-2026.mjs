/**
 * Merge Botswana School of Business Sciences (formerly BAC) 2026-2027 prospectus
 * entry requirements into public/data/programmes.json.
 *
 * Source PDF (checked into /docs by the user):
 * - 2026 - 2027 UNDERGRADUATE PROSPECTUS SOFT COPY 3*.pdf
 *
 * The prospectus provides an institutional BGCSE entry floor phrased as
 * "A minimum of 34 points..." plus programme-level English/Maths minima.
 *
 * This script patches existing BSBS/BAC rows (keeps modules/fees/careers) and
 * adds stubs for any programme blocks found in the PDF that don't already exist.
 *
 * Usage: node scripts/merge-bac-prospectus-2026.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizePdfText, pdfToText } from "./lib/pdfText.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const docsDir = path.join(root, "docs");
const progPath = path.join(root, "public/data/programmes.json");

const UNIVERSITY_NAME = "Botswana School of Business Sciences";
const UNIVERSITY_SHORT = "BSBS";
const OFFICIAL_URL = "https://www.bac.ac.bw/";
const APPLY_URL = "https://thitoacademics.bac.ac.bw/";

function findProspectusPdf() {
  if (!fs.existsSync(docsDir)) return null;
  const files = fs.readdirSync(docsDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  // Prefer the non _copy file when both exist.
  const preferred = files.find((f) => /^2026\s*-\s*2027\s+UNDERGRADUATE\s+PROSPECTUS/i.test(f) && !/_copy/i.test(f));
  if (preferred) return path.join(docsDir, preferred);
  const any = files.find((f) => /^2026\s*-\s*2027\s+UNDERGRADUATE\s+PROSPECTUS/i.test(f));
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

function titleCaseWord(w) {
  if (!w) return w;
  const lower = w.toLowerCase();
  if (["and", "of", "in", "to", "for", "the"].includes(lower)) return lower;
  return lower[0].toUpperCase() + lower.slice(1);
}

function titleCase(s) {
  return String(s || "")
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => titleCaseWord(w))
    .join(" ")
    .trim();
}

function canonicalName(s) {
  let t = String(s || "").toLowerCase();
  t = t.replace(/&/g, " and ");
  t = t.replace(/\bcommunications\b/g, "communication");
  t = t.replace(/\bb\.?\s*sc\b/g, "bachelor of science");
  t = t.replace(/\bbsc\b/g, "bachelor of science");
  t = t.replace(/\bb\.?\s*a\b/g, "bachelor of arts");
  t = t.replace(/\bba\b/g, "bachelor of arts");
  t = t.replace(/\bb\.?\s*com\b/g, "bachelor of commerce");
  t = t.replace(/\bbcom\b/g, "bachelor of commerce");
  t = t.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  return t;
}

function fieldForProgrammeName(name) {
  const n = String(name || "").toLowerCase();
  if (/\bcomput|ict|network|fintech|data analytics|systems engineering\b/i.test(name)) return "Technology";
  if (n.includes("hospitality") || n.includes("tourism")) return "Humanities";
  if (n.includes("insurance")) return "Business";
  if (n.includes("account") || n.includes("finance") || n.includes("tax") || n.includes("procurement") || n.includes("supply")) return "Business";
  return "Business";
}

function isMostlyUppercase(s) {
  const letters = String(s || "").replace(/[^A-Za-z]/g, "");
  if (letters.length < 6) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length > 0.85;
}

const SKIP_TITLE = /^(?:\d+|2026\s*-\s*2027\s*Prospectus|www\.|BQA\s+NCQF\s+LEVEL\s+\d+|ABOUT THE PROGRAMME|RATIONALE|PROGRAMME STRUCTURE|MODE OF STUDY|DURATION|CAMPUS|CAREER OPPORTUNITIES|ASSESSMENT|EXEMPTIONS|COMPULSORY|OPTIONAL|SCHOOL OF.*)$/i;
const TITLE_KEYWORDS = /\b(BA|BSc|B\.Sc|BCom|BCOM|BEng|Bachelor|Diploma|Certificate|Association|Chartered|Certified|Postgraduate|Post Graduate|SAP)\b/i;

function scoreTitleLine(s) {
  const line = String(s || "").trim();
  if (!line || SKIP_TITLE.test(line)) return -1e9;
  const letters = line.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) return -1e9;

  const upper = letters.replace(/[^A-Z]/g, "").length;
  const ratio = upper / letters.length;

  let score = 0;
  if (ratio > 0.85) score += 5;
  if (ratio > 0.95) score += 2;
  if (TITLE_KEYWORDS.test(line)) score += 3;
  if (line.length < 45) score += 2;
  if (line.length < 25) score += 1;
  if (/^The\b/i.test(line)) score -= 4;
  if (/\.$/.test(line)) score -= 2;
  return score;
}

function expandMultiLineTitle(lines, idx) {
  const parts = [lines[idx]];

  // Pull in previous uppercase line(s) if they look like a split heading.
  for (let k = idx - 1; k >= 0 && k >= idx - 3; k--) {
    const l = lines[k];
    if (!l) break;
    if (SKIP_TITLE.test(l)) break;
    if (!isMostlyUppercase(l)) break;
    parts.unshift(l);
  }

  // Pull in following uppercase line(s) until NCQF line/header.
  for (let k = idx + 1; k < lines.length && k <= idx + 4; k++) {
    const l = lines[k];
    if (!l) break;
    if (SKIP_TITLE.test(l)) break;
    if (!isMostlyUppercase(l)) break;
    parts.push(l);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function findBestTitleBefore(lines, entryIdx) {
  let best = { score: -1e9, idx: null };
  for (let k = entryIdx - 1; k >= 0 && k >= entryIdx - 120; k--) {
    const base = scoreTitleLine(lines[k]);
    if (base <= 2) continue;
    // Prefer titles that are closer to the ENTRY REQUIREMENTS marker to avoid
    // accidentally reusing an older heading when a new programme begins.
    const dist = entryIdx - k;
    const sc = base - dist / 40;
    if (sc > best.score) best = { score: sc, idx: k };
  }
  if (best.score <= 2 || best.idx == null) return null;
  return expandMultiLineTitle(lines, best.idx);
}

function readRequirementSlice(lines, entryIdx) {
  const out = [];
  for (let i = entryIdx + 1; i < Math.min(lines.length, entryIdx + 30); i++) {
    const l = lines[i];
    if (!l) continue;
    if (/^\d+$/.test(l)) continue;
    if (/^2026\s*-\s*2027\s*Prospectus/i.test(l)) continue;
    if (/^www\./i.test(l)) continue;
    if (/^(PROGRAMME STRUCTURE|MODE OF STUDY|DURATION|CAMPUS|CAREER OPPORTUNITIES|ASSESSMENT|EXEMPTIONS)\b/i.test(l)) break;
    out.push(l);
    // Requirements are always near the top of this slice; stop once we hit the common OR alternatives.
    if (out.length > 14) break;
  }
  return out;
}

function parseMinPoints(reqLines) {
  const joined = reqLines.join(" ");
  const m = joined.match(/\b(\d{2})\s*points\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function parseSubjectRequirements(reqLines) {
  const t = reqLines.join(" ").replace(/\s+/g, " ");
  /** @type {Record<string, string>} */
  const req = {};

  // Pattern: "English C & Maths B"
  const em = t.match(/\bEnglish\s+([A-E])\b/i);
  const mm = t.match(/\bMaths?\s+([A-E])\b/i);
  if (em) req.english = String(em[1]).toUpperCase();
  if (mm) req.math = String(mm[1]).toUpperCase();

  // Pattern: "minimum D in Mathematics" / "minimum C in English"
  const minMath = t.match(/\bminimum\s+([A-E])\s+in\s+Mathematics\b/i);
  const minEng = t.match(/\bminimum\s+([A-E])\s+in\s+English\b/i);
  if (minMath) req.math = String(minMath[1]).toUpperCase();
  if (minEng) req.english = String(minEng[1]).toUpperCase();

  return req;
}

function normalizeProgrammeTitle(title) {
  // Preserve common acronyms, but make it readable.
  let raw = String(title || "").replace(/\s+/g, " ").trim();
  // Strip trailing parenthetical codes like "(ACCA)", "(BCOM CA)", "(FINTECH)", "(ICT)" for matching.
  raw = raw.replace(/\s*\([A-Z0-9.\- ]{2,30}\)\s*$/i, "").trim();

  if (/^BA\b/i.test(raw)) {
    return raw
      .toUpperCase()
      .replace(/\bBA\b/g, "BA")
      .split(" ")
      .map((w, i) => (i === 0 ? w : titleCaseWord(w)))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (/^BSc\b/i.test(raw) || /^BSC\b/i.test(raw) || /^BSc\./i.test(raw)) {
    const rest = raw.replace(/^BSc\.?\s*/i, "").trim();
    return `Bachelor of Science in ${titleCase(rest)}`.replace(/\s+/g, " ").trim();
  }

  if (/^BACHELOR OF/i.test(raw)) {
    return titleCase(raw.replace(/\s+/g, " ").toLowerCase());
  }

  return titleCase(raw.toLowerCase());
}

function mergeRequirements(existing, patch) {
  return { ...(existing || {}), ...(patch || {}) };
}

function main() {
  const pdfPath = findProspectusPdf();
  if (!pdfPath) {
    console.error("BAC/BSBS merge: could not find BSBS prospectus PDF in docs/.");
    process.exitCode = 1;
    return;
  }

  const raw = normalizePdfText(pdfToText(pdfPath));
  const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l !== "");

  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^ENTRY REQUIREMENTS$/i.test(lines[i])) continue;
    const title = findBestTitleBefore(lines, i);
    if (!title) continue;
    const reqLines = readRequirementSlice(lines, i);
    const minPoints = parseMinPoints(reqLines);
    const req = parseSubjectRequirements(reqLines);
    blocks.push({ title, minPoints, req });
  }

  if (!blocks.length) {
    console.error("BAC/BSBS merge: no ENTRY REQUIREMENTS blocks found in prospectus extract.");
    process.exitCode = 1;
    return;
  }

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));

  // Index existing programmes by canonical name for a fuzzy-but-stable match.
  const existingByKey = new Map();
  for (const p of programmes) {
    const isBac = p?.university === UNIVERSITY_NAME || String(p?.universityShort || "").toUpperCase() === "BAC" || String(p?.universityShort || "").toUpperCase() === "BSBS" || String(p?.id || "").startsWith("bac-") || String(p?.id || "").startsWith("bsbs-");
    if (!isBac) continue;
    const k = canonicalName(p.name);
    if (k && !existingByKey.has(k)) existingByKey.set(k, p);
  }

  let patched = 0;
  let added = 0;

  for (const b of blocks) {
    const name = normalizeProgrammeTitle(b.title);
    const key = canonicalName(name);
    const existing = existingByKey.get(key);

    const minPoints = typeof b.minPoints === "number" && Number.isFinite(b.minPoints) ? b.minPoints : 34;

    if (existing) {
      existing.minPoints = minPoints;
      if (Object.keys(b.req || {}).length) {
        existing.subjectRequirements = mergeRequirements(existing.subjectRequirements, b.req);
      }
      existing.minPointsSource = "BSBS (BAC) prospectus 2026-2027 — entry requirements";
      existing.minPointsTier = "institution_minimum";
      existing.minPointsScaleVersion = 2;
      if (!existing.officialUrl) existing.officialUrl = OFFICIAL_URL;
      if (!existing.applyUrl) existing.applyUrl = APPLY_URL;
      patched++;
      continue;
    }

    programmes.push({
      id: `bac-${slugify(name)}`,
      name,
      field: fieldForProgrammeName(name),
      university: UNIVERSITY_NAME,
      universityShort: UNIVERSITY_SHORT,
      minPoints,
      subjectRequirements: b.req || {},
      duration: null,
      durationYears: null,
      description:
        "Programme at Botswana School of Business Sciences (formerly BAC). Entry requirements are based on the 2026-2027 prospectus; confirm programme-specific details with the institution.",
      officialUrl: OFFICIAL_URL,
      applyUrl: APPLY_URL,
      modules: [],
      careers: [],
      applicationDeadline: null,
      minPointsSource: "BSBS (BAC) prospectus 2026-2027 — entry requirements",
      minPointsTier: "institution_minimum",
      minPointsScaleVersion: 2,
      profileCompleteness: "partial",
      sponsorshipTier: "standard",
    });
    added++;
  }

  fs.writeFileSync(progPath, `${JSON.stringify(programmes, null, 2)}\n`);
  console.error(`BSBS/BAC merge: patched ${patched} existing programmes; added ${added} new stubs.`);
}

main();
