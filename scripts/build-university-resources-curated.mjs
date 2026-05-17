/**
 * Build scripts/data/curated/university-resources.json for all 55 targets.
 * Uses existing resources where present; adds website/apply links for others.
 *
 * Usage: node scripts/build-university-resources-curated.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const targetsPath = path.join(__dirname, "data", "targets", "institutions-55.json");
const uniPath = path.join(root, "public/data/universities.json");
const outPath = path.join(__dirname, "data", "curated", "university-resources.json");

const ADMISSION_PATHS = [
  "/admissions",
  "/admission",
  "/apply",
  "/study",
  "/enrol",
  "/enrollment",
  "/how-to-apply",
  "/undergraduate",
];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function safeUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}

function resolveTargetId(row) {
  return row.mergeIntoExistingUniversityId || row.id;
}

function resource(title, category, url, format, sourceLabel) {
  return { title, category, url, format, sourceLabel };
}

function guessAdmissionUrl(website) {
  if (!website) return "";
  try {
    const base = new URL(website);
    for (const p of ADMISSION_PATHS) {
      const u = new URL(p, base).href;
      if (u !== website) return u;
    }
    return website;
  } catch {
    return website;
  }
}

function baselineForUniversity(uni, target) {
  const sourceLabel = uni?.name || target.nameCanonical;
  const existing = Array.isArray(uni?.resources) ? uni.resources : [];
  if (existing.length >= 2) {
    return { universityId: uni.id, sourceLabel, replace: true, resources: existing };
  }

  const website = safeUrl(target.website || uni?.website);
  const apply = safeUrl(uni?.applyUrl);
  const resources = [];

  if (website && !website.includes("gov.bw")) {
    resources.push(resource("Official website", "Admissions page", website, "Web page", sourceLabel));
    const admissionsGuess = guessAdmissionUrl(website);
    if (admissionsGuess && admissionsGuess !== website) {
      resources.push(resource("Admissions information", "Admissions page", admissionsGuess, "Web page", sourceLabel));
    }
  }

  if (apply && apply !== website) {
    resources.push(resource("Apply online", "How to apply", apply, "Web page", sourceLabel));
  }

  return { universityId: uni?.id || resolveTargetId(target), sourceLabel, replace: true, resources };
}

function main() {
  const targets = readJson(targetsPath);
  const universities = readJson(uniPath);
  const byId = Object.fromEntries(universities.map((u) => [u.id, u]));

  const universitiesOut = [];
  for (const row of targets) {
    const id = resolveTargetId(row);
    const uni = byId[id];
    if (!uni) {
      console.warn(`Missing university id=${id}`);
      continue;
    }
    universitiesOut.push(baselineForUniversity(uni, row));
  }

  const payload = {
    version: 1,
    note: "Curated official links for 55 institutions. Edit then run: node scripts/merge-university-resources.mjs",
    universities: universitiesOut,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${universitiesOut.length} entries to ${outPath}`);
}

main();
