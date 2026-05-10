/**
 * Merge Botswana Open University (BOU) prospectus 2025/26 programme list into programmes.json.
 *
 * Source PDF (checked into /docs by the user):
 * - botswana open university 2025_26_Prospectus_copy.pdf
 *
 * BOU prospectus publishes entry requirements primarily in passes/credits/grades,
 * not a single numeric "best-six points" cut-off. Thuto's predictor uses points,
 * so this script sets `minPoints` to null and stores grade minima in `subjectRequirements`
 * when stated explicitly (e.g. "Grade C or better in English and Mathematics").
 *
 * The script replaces existing BOU rows (universityShort BOu / id bou-*) with the
 * programme blocks parsed from the prospectus.
 *
 * Usage: node scripts/merge-bou-prospectus-2025-26.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizePdfText, pdfToText } from "./lib/pdfText.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const docsDir = path.join(root, "docs");
const progPath = path.join(root, "public/data/programmes.json");

const UNIVERSITY_NAME = "Botswana Open University";
const UNIVERSITY_SHORT = "BOU";
const OFFICIAL_URL = "https://www.bou.ac.bw/";

function findPdf() {
  if (!fs.existsSync(docsDir)) return null;
  const files = fs.readdirSync(docsDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  const exact = files.find((f) => /botswana\s+open\s+university.*2025_26.*prospectus.*\.pdf$/i.test(f));
  if (exact) return path.join(docsDir, exact);
  const any = files.find((f) => /bou/i.test(f) && /prospectus/i.test(f));
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

function cleanTitleLine(line) {
  return String(line || "")
    .replace(/^\d+\.\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fieldForName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("education") || n.includes("teaching") || n.includes("child") || n.includes("youth") || n.includes("vocational")) return "Education";
  if (n.includes("technology") || n.includes("information") || n.includes("comput") || n.includes("office") || n.includes("systems")) return "Technology";
  if (n.includes("public administration")) return "Business";
  if (n.includes("business") || n.includes("commerce") || n.includes("marketing") || n.includes("human resources") || n.includes("entrepreneur")) return "Business";
  return "General";
}

function durationYearsFromText(text) {
  const t = String(text || "");
  // Common pattern: "minimum completion time is four (4) years"
  let m = t.match(/minimum[^.\n]{0,60}\((\d+(?:\.\d+)?)\)\s*years/i);
  if (m) return Number(m[1]);
  // Pattern: "three and half years"
  m = t.match(/\b(\d+)\s+and\s+half\s+years/i);
  if (m) return Number(m[1]) + 0.5;
  m = t.match(/\b(One|Two|Three|Four|Five|Six)\s+and\s+half\s+years/i);
  if (m) {
    const map = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    const n = map[m[1].toLowerCase()];
    return typeof n === "number" ? n + 0.5 : null;
  }
  // Pattern: "Three years for..." (no parentheses sometimes)
  m = t.match(/\b(One|Two|Three|Four|Five|Six)\s+years\b/i);
  if (m) {
    const map = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    const n = map[m[1].toLowerCase()];
    return typeof n === "number" ? n : null;
  }
  // Fallback: 6 months
  if (/six\s+months/i.test(t)) return 0.5;
  return null;
}

function parseRequirementsToSubjectReq(reqText) {
  const t = String(reqText || "").replace(/\s+/g, " ").trim();
  /** @type {Record<string, string>} */
  const req = {};

  // "Grade C or better in both English and Mathematics"
  const bothC = t.match(/grade\s+([A-E])\s+or\s+better\s+in\s+both\s+english\s+and\s+mathematics/i);
  if (bothC) {
    const g = String(bothC[1]).toUpperCase();
    req.english = g;
    req.math = g;
    return req;
  }

  // "credits (Grade C or better) in Mathematics and English Language"
  const credits = t.match(/grade\s+([A-E])\s+or\s+better\)\s+in\s+mathematics\s+and\s+english/i);
  if (credits) {
    const g = String(credits[1]).toUpperCase();
    req.math = g;
    req.english = g;
    return req;
  }

  // Explicit single-subject minima.
  const em = t.match(/\benglish(?:\s+language)?\b[^A-E]{0,12}\bgrade\s+([A-E])\b/i);
  const mm = t.match(/\bmathematics\b[^A-E]{0,12}\bgrade\s+([A-E])\b/i);
  if (em) req.english = String(em[1]).toUpperCase();
  if (mm) req.math = String(mm[1]).toUpperCase();

  // "pass in English"
  if (!req.english && /\bpass\s+in\s+english\b/i.test(t)) req.english = "E";
  if (!req.math && /\bpass\s+in\s+mathematics\b/i.test(t)) req.math = "E";

  return req;
}

function extractBlocks(text) {
  const lines = String(text || "").split("\n").map((l) => l.trim());
  /** @type {number[]} */
  const starts = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!/^\d+\.\s+/.test(l)) continue;
    if (!/(Certificate|Diploma|Bachelor|Executive Master|Master|Microsoft Office Suite)/i.test(l)) continue;
    starts.push(i);
  }

  /** @type {Array<{ title: string, body: string, start: number }>} */
  const blocks = [];
  for (let si = 0; si < starts.length; si++) {
    const s = starts[si];
    const e = si + 1 < starts.length ? starts[si + 1] : lines.length;
    const bodyLines = lines.slice(s, e).filter(Boolean);
    const body = bodyLines.join("\n");
    if (!/Entry Requirements/i.test(body)) continue;
    blocks.push({ title: cleanTitleLine(lines[s]), body, start: s });
  }
  return blocks;
}

function main() {
  const pdfPath = findPdf();
  if (!pdfPath) {
    console.error("BOU merge: could not find BOU prospectus PDF in docs/.");
    process.exitCode = 1;
    return;
  }

  const raw = normalizePdfText(pdfToText(pdfPath));
  const blocks = extractBlocks(raw);
  if (!blocks.length) {
    console.error("BOU merge: no programme blocks with Entry Requirements found in prospectus extract.");
    process.exitCode = 1;
    return;
  }

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const kept = programmes.filter(
    (p) =>
      String(p.university || "") !== UNIVERSITY_NAME &&
      String(p.universityShort || "").toUpperCase() !== UNIVERSITY_SHORT &&
      !String(p.id || "").startsWith("bou-"),
  );

  const incoming = [];
  const seenIds = new Set(kept.map((p) => p.id));

  for (const b of blocks) {
    const lines = b.body.split("\n");

    // Prefer narrative between title and Programme Duration for description.
    let description = null;
    const titleIdx = lines.findIndex((l) => cleanTitleLine(l) === b.title);
    if (titleIdx >= 0) {
      const descLines = [];
      for (let i = titleIdx + 1; i < Math.min(lines.length, titleIdx + 40); i++) {
        const l = lines[i].trim();
        if (!l) continue;
        if (/^(Programme Duration|Entry Requirements|Programme Content)\b/i.test(l)) break;
        // Page breaks can produce bare page numbers.
        if (/^\d+$/.test(l)) continue;
        descLines.push(l);
        if (descLines.join(" ").length > 420) break;
      }
      const joined = descLines.join(" ").replace(/\s+/g, " ").trim();
      description = joined || null;
    }

    // Duration section.
    const durIdx = lines.findIndex((l) => /^Programme Duration$/i.test(l.trim()));
    let durationText = null;
    if (durIdx >= 0) {
      const durLines = [];
      for (let i = durIdx + 1; i < Math.min(lines.length, durIdx + 10); i++) {
        const l = lines[i].trim();
        if (!l) continue;
        if (/^(Entry Requirements|Programme Content)\b/i.test(l)) break;
        durLines.push(l);
      }
      durationText = durLines.join(" ").replace(/\s+/g, " ").trim() || null;
    }

    const durationYears = durationYearsFromText(durationText || "");
    const duration =
      durationYears == null
        ? null
        : durationYears === 0.5
          ? "6 months"
          : durationYears === 1
            ? "1 year"
            : `${durationYears} years`;

    // Entry requirements.
    const reqIdx = lines.findIndex((l) => /^Entry Requirements$/i.test(l.trim()));
    let reqText = "";
    if (reqIdx >= 0) {
      const reqLines = [];
      for (let i = reqIdx + 1; i < Math.min(lines.length, reqIdx + 30); i++) {
        const l = lines[i].trim();
        if (!l) continue;
        if (/^(Programme Content|Programme Duration)\b/i.test(l)) break;
        reqLines.push(l);
      }
      reqText = reqLines.join(" ").replace(/\s+/g, " ").trim();
    }

    const subjectRequirements = parseRequirementsToSubjectReq(reqText);

    const baseId = `bou-${slugify(b.title)}`;
    let id = baseId;
    let suffix = 2;
    while (seenIds.has(id)) {
      id = `${baseId}-${suffix++}`;
    }
    seenIds.add(id);

    incoming.push({
      id,
      name: b.title,
      field: fieldForName(b.title),
      university: UNIVERSITY_NAME,
      universityShort: UNIVERSITY_SHORT,
      minPoints: null,
      subjectRequirements,
      duration,
      durationYears: durationYears == null ? null : durationYears,
      description:
        description ||
        "Programme at Botswana Open University (BOU). Entry requirements are based on the 2025/26 prospectus; confirm programme-specific requirements and intake details with the institution.",
      officialUrl: OFFICIAL_URL,
      applyUrl: OFFICIAL_URL,
      modules: [],
      careers: [],
      applicationDeadline: null,
      minPointsSource:
        "BOU prospectus 2025/26 — entry requirements are described via passes/credits/grades (no single numeric best-six points cut-off published).",
      minPointsTier: "manual",
      minPointsScaleVersion: 2,
      profileCompleteness: "partial",
      sponsorshipTier: "standard",
    });
  }

  fs.writeFileSync(progPath, `${JSON.stringify([...kept, ...incoming], null, 2)}\n`);
  console.error(`BOU merge: wrote ${incoming.length} programmes (replaced existing BOU rows).`);
}

main();
