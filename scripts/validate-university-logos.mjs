/**
 * Validate bundled university logo coverage and asset references.
 *
 * Usage: node scripts/validate-university-logos.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { UNIVERSITY_LOGO_BY_ID } from "../src/lib/universityBranding.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const uniPath = path.join(root, "public", "data", "universities.json");
const publicDir = path.join(root, "public");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fileExistsFromPublic(relativePath) {
  return fs.existsSync(path.join(publicDir, relativePath));
}

function main() {
  const universities = readJson(uniPath);
  const byId = new Map(universities.map((u) => [u.id, u]));
  const errors = [];

  for (const university of universities) {
    if (!university?.logo) continue;
    if (!fileExistsFromPublic(university.logo)) {
      errors.push(`${university.id}: logo path '${university.logo}' does not exist under public/`);
    }
  }

  for (const [id, logoPath] of Object.entries(UNIVERSITY_LOGO_BY_ID)) {
    const university = byId.get(id);
    if (!university) {
      errors.push(`${id}: logo map entry has no matching university record`);
      continue;
    }

    if (!fileExistsFromPublic(logoPath)) {
      errors.push(`${id}: fallback logo asset '${logoPath}' does not exist under public/`);
    }

    if (university.logo && university.logo !== logoPath) {
      errors.push(
        `${id}: fallback logo map points to '${logoPath}' but bundled university data has '${university.logo}'`,
      );
    }
  }

  if (errors.length) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`validate-university-logos: OK (${universities.filter((u) => u.logo).length} bundled logos)`);
}

main();
