/**
 * Merge Namibian NQA-accredited institutions into:
 * - public/data/universities.json (country: "na")
 * - public/data/programmes.json (sparse programme rows, country: "na")
 *
 * Also backfills country: "bw" on existing Botswana rows missing the field.
 *
 * Usage: node scripts/merge-institutions-namibia.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const targetsPath = path.join(__dirname, "data", "targets", "institutions-namibia.json");
const uniPath = path.join(root, "public", "data", "universities.json");
const progPath = path.join(root, "public", "data", "programmes.json");

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

function pickFieldForName(name) {
  const n = String(name || "").toLowerCase();
  if (/(nursing|midwifery|health|pharmacy|dental|medical|occupational health|counselling|counseling)/.test(n)) {
    return "Health Sciences";
  }
  if (/(engineering|electrical|civil|mechanical|mining|construction|automotive|metal fabrication|air conditioning)/.test(n)) {
    return "Engineering";
  }
  if (/(computer|computing|information technology|\bit\b|network|cyber|software|systems|informatics)/.test(n)) {
    return "Technology";
  }
  if (/(accounting|finance|bank|business|management|marketing|procurement|economics|entrepreneur|retail|supply)/.test(n)) {
    return "Business";
  }
  if (/(education|teaching|primary|secondary|early childhood|montessori)/.test(n)) return "Education";
  if (/(agric|hortic|animal|crop|environment)/.test(n)) return "Agriculture";
  if (/(hospitality|tourism|cookery|culinary|beauty|spa)/.test(n)) return "Hospitality";
  if (/(theology|ministry|divinity|seminary|christian)/.test(n)) return "Theology";
  if (/(science|chemistry|physics|biology|mathematics)/.test(n)) return "Natural Sciences";
  return "Humanities";
}

function durationForName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("short course") || n.includes("workshop")) return { duration: "Short course", durationYears: null };
  if (n.includes("national vocational certificate") || n.startsWith("certificate") || n.includes("certificate in")) {
    return { duration: "1 year", durationYears: 1 };
  }
  if (n.includes("diploma") || n.startsWith("diploma")) return { duration: "2 years", durationYears: 2 };
  if (n.includes("bachelor") || /\bb(sc|a|com|eng|ed)\b/.test(n)) return { duration: "4 years", durationYears: 4 };
  return { duration: "N/A", durationYears: null };
}

function buildProgrammeRow({ universityId, universityName, universityShort, programmeName }) {
  const { duration, durationYears } = durationForName(programmeName);
  return {
    id: `${universityId}-${slugify(programmeName)}`.slice(0, 180),
    name: programmeName,
    field: pickFieldForName(programmeName),
    university: universityName,
    universityShort,
    country: "na",
    minPoints: null,
    subjectRequirements: {},
    duration,
    durationYears,
    description: `Programme at ${universityName} (Namibia). Verify entry requirements, fees, and modules with the institution. Guidance only — not official admission advice.`,
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
  const existing = universities.find((u) => u?.id === target.id);
  if (existing) {
    existing.country = "na";
    if (!existing.location && target.location) existing.location = target.location;
    if (!existing.website && target.website) existing.website = target.website;
    if (!existing.shortName && target.nameShort) existing.shortName = target.nameShort;
    if (!existing.description) {
      existing.description =
        "Tertiary provider in Namibia (NQA-accredited listing). Verify programme details with the institution.";
    }
    if (!existing.sponsorshipTier) existing.sponsorshipTier = "standard";
    return { added: false, record: existing };
  }

  const record = {
    id: target.id,
    name: target.nameCanonical,
    ...(target.nameShort ? { shortName: target.nameShort } : {}),
    location: target.location || "Namibia",
    country: "na",
    description:
      "Tertiary provider in Namibia (NQA-accredited listing). Verify programme details with the institution. Guidance only — not official admission advice.",
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

function backfillBotswanaCountry(universities, programmes) {
  let uniCount = 0;
  let progCount = 0;
  for (const u of universities) {
    if (!u.country) {
      u.country = "bw";
      uniCount += 1;
    }
  }
  for (const p of programmes) {
    if (!p.country) {
      p.country = "bw";
      progCount += 1;
    }
  }
  return { uniCount, progCount };
}

function main() {
  const targets = readJson(targetsPath);
  const universities = readJson(uniPath);
  const programmes = readJson(progPath);

  const { uniCount, progCount } = backfillBotswanaCountry(universities, programmes);
  const progById = new Map(programmes.map((p) => [p.id, p]));

  let addedUnis = 0;
  let addedProgs = 0;

  for (const t of targets) {
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
        backfilledCountryBw: { universities: uniCount, programmes: progCount },
        namibiaTargets: targets.length,
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
