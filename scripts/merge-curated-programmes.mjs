/**
 * Merge curated programme lists from scripts/data/curated/programmes/*.json
 * into public/data/programmes.json.
 *
 * Usage: node scripts/merge-curated-programmes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const curatedDir = path.join(__dirname, "data", "curated", "programmes");
const progPath = path.join(root, "public/data/programmes.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isNonEmptyArray(v) {
  return Array.isArray(v) && v.length > 0;
}

function pickFieldForName(name) {
  const n = String(name || "").toLowerCase();
  if (/(nursing|midwif|public health|health|pharmacy|clinical|medical)/.test(n)) return "Health";
  if (/(law|legal|llb)/.test(n)) return "Law";
  if (/(engineering|electrical|civil|mechanical|mining|construction|architecture|quantity surveying)/.test(n)) return "Engineering";
  if (/(computer|computing|information technology|network|cyber|software|systems|informatics|multimedia|ict)/.test(n)) return "Technology";
  if (/(accounting|finance|bank|business|management|marketing|procurement|economics|entrepreneur|commerce|administration)/.test(n)) return "Business";
  if (/(education|teaching|primary|secondary|early childhood)/.test(n)) return "Education";
  if (/(agric|hortic|animal|range|forestry|environment|ecology|geology)/.test(n)) return "Natural Sciences";
  if (/(design|fashion|animation|graphic|visual|media|journalism|film|broadcast)/.test(n)) return "Humanities";
  if (/(science|chemistry|physics|biology|mathematics|statistics|forensic)/.test(n)) return "Natural Sciences";
  return "Humanities";
}

function durationForName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("short course") || n.includes("workshop")) return { duration: "Short course", durationYears: null };
  if (n.startsWith("certificate") || n.includes("certificate in") || n.includes("association of accounting technicians")) {
    return { duration: "1 year", durationYears: 1 };
  }
  if (n.startsWith("diploma") || n.includes("diploma in") || n.includes("advanced diploma")) {
    return { duration: "2 years", durationYears: 2 };
  }
  if (n.includes("post graduate diploma") || n.includes("postgraduate diploma")) return { duration: "1 year", durationYears: 1 };
  if (n.includes("master") || n.includes("mphil") || n.startsWith("m")) return { duration: "2 years", durationYears: 2 };
  if (n.includes("phd") || n.includes("doctor")) return { duration: "3+ years", durationYears: 3 };
  if (n.includes("bachelor") || /\bb(sc|a|com|eng|ed|bus)\b/.test(n)) {
    if (n.includes("engineering")) return { duration: "5 years", durationYears: 5 };
    return { duration: "4 years", durationYears: 4 };
  }
  if (n.startsWith("associate")) return { duration: "2 years", durationYears: 2 };
  return { duration: "4 years", durationYears: 4 };
}

function buildProgrammeRow(row, defaults) {
  const name = String(row.name || "").trim();
  if (!name) return null;
  const id = row.id || `${defaults.universityId}-${slugify(name)}`;
  const field = row.field || pickFieldForName(name);
  const { duration, durationYears } = row.duration
    ? { duration: row.duration, durationYears: row.durationYears ?? null }
    : durationForName(name);
  return {
    id,
    name,
    field,
    university: defaults.universityName,
    universityShort: defaults.universityShort,
    faculty: row.faculty || undefined,
    minPoints: row.minPoints ?? null,
    subjectRequirements: row.subjectRequirements || {},
    duration,
    durationYears,
    description:
      row.description ||
      `Programme at ${defaults.universityName}. Confirm entry requirements, fees, and modules with the institution.`,
    officialUrl: row.officialUrl || defaults.officialUrl || null,
    applyUrl: row.applyUrl || defaults.applyUrl || defaults.officialUrl || null,
    modules: row.modules || [],
    careers: row.careers || [],
    applicationDeadline: row.applicationDeadline ?? null,
    minPointsSource: row.minPointsSource ?? null,
    minPointsTier: row.minPointsTier ?? "manual",
    minPointsScaleVersion: 2,
    profileCompleteness: row.profileCompleteness || "partial",
    sponsorshipTier: row.sponsorshipTier || "standard",
    qualification: row.qualification || undefined,
    studyMode: row.studyMode || undefined,
  };
}

function mergeProgramme(existing, incoming) {
  const out = { ...existing };
  if (!isNonEmptyArray(out.modules) && isNonEmptyArray(incoming.modules)) out.modules = incoming.modules;
  if (!isNonEmptyArray(out.careers) && isNonEmptyArray(incoming.careers)) out.careers = incoming.careers;
  if (!out.fees && incoming.fees) out.fees = incoming.fees;
  if (out.minPoints == null && incoming.minPoints != null) out.minPoints = incoming.minPoints;
  if (!out.subjectRequirements || Object.keys(out.subjectRequirements).length === 0) {
    out.subjectRequirements = incoming.subjectRequirements;
  }
  for (const k of [
    "name",
    "field",
    "faculty",
    "duration",
    "durationYears",
    "description",
    "officialUrl",
    "applyUrl",
    "applicationDeadline",
    "qualification",
    "studyMode",
    "profileCompleteness",
    "minPointsSource",
  ]) {
    if (out[k] == null || out[k] === "" || (Array.isArray(out[k]) && out[k].length === 0)) {
      if (incoming[k] != null && incoming[k] !== "") out[k] = incoming[k];
    }
  }
  return out;
}

function processCuratedFile(curated, byId, stats) {
  const batches = Array.isArray(curated.institutions)
    ? curated.institutions
    : curated.universityId
      ? [curated]
      : [];

  for (const batch of batches) {
    const defaults = {
      universityId: batch.universityId,
      universityName: batch.universityName,
      universityShort: batch.universityShort,
      officialUrl: batch.officialUrl,
      applyUrl: batch.applyUrl,
    };
    const rows = Array.isArray(batch.programmes) ? batch.programmes : [];
    stats.rows += rows.length;
    for (const row of rows) {
      const incoming = buildProgrammeRow(row, defaults);
      if (!incoming) continue;
      const existing = byId.get(incoming.id);
      if (existing) {
        byId.set(incoming.id, mergeProgramme(existing, incoming));
        stats.updated++;
      } else {
        byId.set(incoming.id, incoming);
        stats.added++;
      }
    }
  }
}

function main() {
  if (!fs.existsSync(curatedDir)) {
    console.error(`Curated programmes directory not found: ${curatedDir}`);
    process.exitCode = 1;
    return;
  }

  const files = fs.readdirSync(curatedDir).filter((f) => f.endsWith(".json"));
  if (!files.length) {
    console.error("No curated programme files found.");
    process.exitCode = 1;
    return;
  }

  const programmes = readJson(progPath);
  const byId = new Map(programmes.map((p) => [p.id, p]));
  const stats = { added: 0, updated: 0, rows: 0 };

  for (const file of files.sort()) {
    const curated = readJson(path.join(curatedDir, file));
    const rowStart = stats.rows;
    processCuratedFile(curated, byId, stats);
    console.log(`${file}: processed ${stats.rows - rowStart} programme rows`);
  }

  fs.writeFileSync(progPath, `${JSON.stringify([...byId.values()], null, 2)}\n`);
  console.log(`Curated merge complete: ${stats.added} added, ${stats.updated} updated. Total programmes: ${byId.size}`);
}

main();
