/**
 * Validate that the 55-institution target list is represented in Thuto data.
 *
 * Usage: node scripts/validate-institutions-55.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const targetsPath = path.join(__dirname, "data", "targets", "institutions-55.json");
const uniPath = path.join(root, "public", "data", "universities.json");
const progPath = path.join(root, "public", "data", "programmes.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

function fail(errors) {
  for (const e of errors) console.error(`ERROR: ${e}`);
  process.exitCode = 1;
}

function findDuplicates(arr) {
  const seen = new Set();
  const dups = new Set();
  for (const x of arr) {
    if (seen.has(x)) dups.add(x);
    else seen.add(x);
  }
  return [...dups];
}

function countProgrammesForInstitution(programmes, canonicalId, uniName, uniShort) {
  const pref = `${canonicalId}-`;
  const nName = norm(uniName);
  const nShort = norm(uniShort);
  let count = 0;
  for (const p of programmes) {
    if (!p || !p.id) continue;
    if (String(p.id).startsWith(pref)) {
      count++;
      continue;
    }
    if (nShort && norm(p.universityShort) === nShort) {
      count++;
      continue;
    }
    if (nName && norm(p.university) === nName) {
      count++;
      continue;
    }
  }
  return count;
}

function main() {
  const targets = readJson(targetsPath);
  const universities = readJson(uniPath);
  const programmes = readJson(progPath);

  const errors = [];

  if (!Array.isArray(targets) || targets.length !== 55) {
    errors.push(`targets must be an array of 55 rows (got ${Array.isArray(targets) ? targets.length : typeof targets})`);
  }

  const uniIds = universities.map((u) => u?.id).filter(Boolean);
  const uniDup = findDuplicates(uniIds);
  if (uniDup.length) errors.push(`duplicate university ids: ${uniDup.join(", ")}`);

  const progIds = programmes.map((p) => p?.id).filter(Boolean);
  const progDup = findDuplicates(progIds);
  if (progDup.length) errors.push(`duplicate programme ids: ${progDup.join(", ")}`);

  const uniById = new Map(universities.map((u) => [u.id, u]));

  for (const t of targets) {
    const canonicalId = t.mergeIntoExistingUniversityId || t.id;
    const uni = uniById.get(canonicalId);
    if (!uni) {
      errors.push(`missing university record for target '${t.sourceName || t.nameCanonical || canonicalId}' (id '${canonicalId}')`);
      continue;
    }

    const count = countProgrammesForInstitution(programmes, canonicalId, uni.name, t.nameShort || "");
    if (count === 0 && !t.allowNoProgrammes) {
      errors.push(`target institution '${uni.name}' (id '${canonicalId}') has 0 programmes and is not allowNoProgrammes`);
    }
  }

  if (errors.length) {
    fail(errors);
    return;
  }

  console.error("validate-institutions-55: OK");
  console.error("Tip: run node scripts/validate-university-resources.mjs for resources[] checks");
}

main();

