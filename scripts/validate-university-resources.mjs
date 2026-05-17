/**
 * Validate university resources[] entries in public/data/universities.json.
 *
 * Usage: node scripts/validate-university-resources.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const targetsPath = path.join(__dirname, "data", "targets", "institutions-55.json");
const uniPath = path.join(root, "public/data/universities.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function safeExternalUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function main() {
  const targets = readJson(targetsPath);
  const universities = readJson(uniPath);
  const byId = Object.fromEntries(universities.map((u) => [u.id, u]));
  const errors = [];
  const warnings = [];

  for (const row of targets) {
    const id = row.mergeIntoExistingUniversityId || row.id;
    const uni = byId[id];
    if (!uni) continue;

    const resources = uni.resources;
    if (!Array.isArray(resources)) {
      warnings.push(`${id}: missing resources array (UI uses empty state)`);
      continue;
    }

    if (resources.length === 0) {
      warnings.push(`${id}: resources[] is empty`);
    }

    const seen = new Set();
    for (const [i, r] of resources.entries()) {
      if (!r?.title?.trim()) errors.push(`${id}: resources[${i}] missing title`);
      const url = safeExternalUrl(r?.url);
      if (!url) errors.push(`${id}: resources[${i}] invalid url '${r?.url}'`);
      if (url && seen.has(url)) errors.push(`${id}: duplicate resource url ${url}`);
      if (url) seen.add(url);
    }
  }

  for (const w of warnings) console.warn(`WARN: ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`ERROR: ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log(`validate-university-resources: OK (${warnings.length} warnings)`);
}

main();
