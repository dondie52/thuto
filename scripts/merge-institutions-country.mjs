/**
 * Merge a country institution target file into universities.json + programmes.json.
 *
 * Usage:
 *   node scripts/merge-institutions-country.mjs scripts/data/targets/institutions-zimbabwe.json
 *   node scripts/merge-institutions-country.mjs scripts/data/targets/institutions-zambia.json
 *   node scripts/merge-institutions-country.mjs scripts/data/targets/institutions-south-africa.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const uniPath = path.join(root, "public", "data", "universities.json");
const progPath = path.join(root, "public", "data", "programmes.json");

const targetsPath = process.argv[2];
if (!targetsPath) {
  console.error("Usage: node scripts/merge-institutions-country.mjs <targets.json>");
  process.exit(1);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const COUNTRY_LABEL = { bw: "Botswana", na: "Namibia", zw: "Zimbabwe", zm: "Zambia", za: "South Africa", ls: "Lesotho", sz: "Eswatini" };

function pickFieldForName(name) {
  const n = String(name || "").toLowerCase();
  if (/(nursing|midwifery|health|pharmacy|dental|medical|medicine)/.test(n)) return "Health Sciences";
  if (/(engineering|electrical|civil|mechanical|mining|construction|architecture)/.test(n)) return "Engineering";
  if (/(computer|computing|information technology|\bit\b|software|informatics)/.test(n)) return "Technology";
  if (/(accounting|finance|business|management|marketing|economics|entrepreneur)/.test(n)) return "Business";
  if (/(education|teaching|primary|secondary)/.test(n)) return "Education";
  if (/(agric|hortic|animal|crop)/.test(n)) return "Agriculture";
  if (/(theology|ministry|divinity|seminary|christian)/.test(n)) return "Theology";
  if (/(law|legal)/.test(n)) return "Law";
  if (/(science|chemistry|physics|biology|mathematics)/.test(n)) return "Natural Sciences";
  return "Humanities";
}

function durationForName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("certificate")) return { duration: "1 year", durationYears: 1 };
  if (n.includes("diploma") && !n.includes("postgraduate")) return { duration: "2 years", durationYears: 2 };
  if (n.includes("bachelor") || /\bb(sc|a|com|eng|ed|tech)\b/.test(n)) return { duration: "4 years", durationYears: 4 };
  if (n.includes("master") || n.includes("postgraduate")) return { duration: "1–2 years", durationYears: 2 };
  if (n.includes("doctor") || n.includes("phd")) return { duration: "3 years", durationYears: 3 };
  return { duration: "N/A", durationYears: null };
}

function buildProgrammeRow({ universityId, universityName, universityShort, programmeName, country }) {
  const { duration, durationYears } = durationForName(programmeName);
  const label = COUNTRY_LABEL[country] || country;
  return {
    id: `${universityId}-${slugify(programmeName)}`.slice(0, 180),
    name: programmeName,
    field: pickFieldForName(programmeName),
    university: universityName,
    universityShort,
    country,
    minPoints: null,
    subjectRequirements: {},
    duration,
    durationYears,
    description: `Programme at ${universityName} (${label}). Verify entry requirements, fees, and modules with the institution. Guidance only — not official admission advice.`,
    officialUrl: null,
    applyUrl: null,
    modules: [],
    careers: [],
    applicationDeadline: null,
    minPointsSource: null,
    minPointsTier: "manual",
    minPointsScaleVersion: 2,
    profileCompleteness: "partial",
    sponsorshipTier: "standard",
  };
}

function ensureUniversityRecord(universities, target) {
  const country = target.country;
  const label = COUNTRY_LABEL[country] || country;
  const existing = universities.find((u) => u?.id === target.id);
  if (existing) {
    existing.country = country;
    if (!existing.location && target.location) existing.location = target.location;
    if (!existing.website && target.website) existing.website = target.website;
    if (!existing.shortName && target.nameShort) existing.shortName = target.nameShort;
    if (!existing.description) {
      existing.description = `Tertiary provider in ${label}. Verify programme details with the institution. Guidance only — not official admission advice.`;
    }
    if (!existing.sponsorshipTier) existing.sponsorshipTier = "standard";
    return { added: false, record: existing };
  }

  const record = {
    id: target.id,
    name: target.nameCanonical,
    ...(target.nameShort ? { shortName: target.nameShort } : {}),
    location: target.location || label,
    country,
    description: `Tertiary provider in ${label}. Verify programme details with the institution. Guidance only — not official admission advice.`,
    website: target.website || null,
    phone: target.phone || null,
    applicationOpen: null,
    applicationClose: null,
    academicYearStart: null,
    applyUrl: target.website || null,
    featured: false,
    sponsorshipTier: "standard",
    resources: [],
  };
  universities.push(record);
  return { added: true, record };
}

function main() {
  const abs = path.isAbsolute(targetsPath) ? targetsPath : path.join(root, targetsPath);
  const targets = readJson(abs);
  const universities = readJson(uniPath);
  const programmes = readJson(progPath);
  const progById = new Map(programmes.map((p) => [p.id, p]));

  let addedUnis = 0;
  let addedProgs = 0;
  const countries = new Set();

  for (const t of targets) {
    if (!t?.id || !t?.country) continue;
    countries.add(t.country);
    const { added, record } = ensureUniversityRecord(universities, t);
    if (added) addedUnis += 1;
    const universityName = record.name;
    const universityShort = t.nameShort || record.shortName || record.name;
    for (const programmeName of t.programmes || []) {
      const row = buildProgrammeRow({
        universityId: t.id,
        universityName,
        universityShort,
        programmeName,
        country: t.country,
      });
      if (progById.has(row.id)) continue;
      progById.set(row.id, row);
      programmes.push(row);
      addedProgs += 1;
    }
  }

  writeJson(uniPath, universities);
  writeJson(progPath, programmes);

  console.log(
    JSON.stringify(
      {
        targetsFile: abs,
        countries: [...countries],
        targets: targets.length,
        addedUniversities: addedUnis,
        addedProgrammes: addedProgs,
        totalUniversities: universities.length,
        totalProgrammes: programmes.length,
      },
      null,
      2,
    ),
  );
}

main();
