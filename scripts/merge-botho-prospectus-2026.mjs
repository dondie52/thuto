/**
 * Merge Botho University programme list from the 2026 Botswana campus prospectus into programmes.json.
 *
 * Source: docs/Botho-University-2026-Botswana-Campus-Prospectus_copy.pdf
 *
 * Usage: node scripts/merge-botho-prospectus-2026.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizePdfText, pdfToText } from "./lib/pdfText.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");
const docsDir = path.join(root, "docs");

const UNIVERSITY_NAME = "Botho University";
const UNIVERSITY_SHORT = "Botho";
const OFFICIAL_URL = "https://www.bothouniversity.com/botswana";
const APPLY_URL = "https://bothouniversity.academiaerp.com/applicant-portal/#/auth/login";

function findPdf() {
  if (!fs.existsSync(docsDir)) return null;
  const files = fs.readdirSync(docsDir);
  const exact = files.find((f) => /Botho-University-2026.*Prospectus.*\.pdf$/i.test(f));
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

function fieldForName(name) {
  const n = String(name || "").toLowerCase();
  if (/(engineering|electrical|mechanical|electronics)/.test(n)) return "Engineering";
  if (/(computer|software|cyber|network|data|analytics|technology|information)/.test(n)) return "Technology";
  if (/(nursing|health|hospital|public health|biomedical)/.test(n)) return "Health";
  if (/(education|teaching)/.test(n)) return "Education";
  if (/(law|llb)/.test(n)) return "Law";
  if (/(commerce|business|accounting|finance|marketing|hrm|hospitality)/.test(n)) return "Business";
  return "Business";
}

function parseProgrammeNames(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    if (!/^(Bachelor of|BSc|BEng|BCom|BBA|BEd|LLB|Diploma in|Certificate in)\b/i.test(line)) continue;
    if (line.length > 140) continue;
    out.push(line.replace(/\s+/g, " ").trim());
  }
  const seen = new Set();
  return out.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function main() {
  const pdfPath = findPdf();
  if (!pdfPath) {
    console.error("Botho merge: could not find Botho 2026 prospectus PDF in docs/.");
    console.error("Expected filename like Botho-University-2026-Botswana-Campus-Prospectus_copy.pdf");
    process.exitCode = 1;
    return;
  }

  const raw = normalizePdfText(pdfToText(pdfPath));
  const names = parseProgrammeNames(raw);
  if (!names.length) {
    console.error("Botho merge: did not find programme names in the prospectus extract.");
    process.exitCode = 1;
    return;
  }

  const incoming = names.map((name) => ({
    id: `botho-${slugify(name)}`,
    name,
    field: fieldForName(name),
    university: UNIVERSITY_NAME,
    universityShort: UNIVERSITY_SHORT,
    minPoints: null,
    subjectRequirements: {},
    duration: name.toLowerCase().includes("engineering") ? "5 years" : "4 years",
    durationYears: name.toLowerCase().includes("engineering") ? 5 : 4,
    description:
      "Programme at Botho University. Confirm entry requirements and intake dates on the official prospectus.",
    officialUrl: OFFICIAL_URL,
    applyUrl: APPLY_URL,
    modules: [],
    careers: [],
    profileCompleteness: "partial",
    sponsorshipTier: "standard",
    minPointsSource: "Botho University 2026 Botswana campus prospectus",
    minPointsTier: "manual",
    minPointsScaleVersion: 2,
  }));

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const byId = new Map(programmes.map((p) => [p.id, p]));
  let added = 0;
  let updated = 0;
  for (const row of incoming) {
    const existing = byId.get(row.id);
    if (existing) {
      byId.set(row.id, { ...existing, ...row, modules: existing.modules?.length ? existing.modules : row.modules });
      updated++;
    } else {
      byId.set(row.id, row);
      added++;
    }
  }

  fs.writeFileSync(progPath, `${JSON.stringify([...byId.values()], null, 2)}\n`);
  console.log(`Botho merge: ${added} added, ${updated} updated (${names.length} names parsed from PDF).`);
}

main();
