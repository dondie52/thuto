/**
 * Validate that bundled university data does not include trademark logos.
 *
 * Usage: node scripts/validate-university-logos.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uniPath = path.join(__dirname, "..", "public", "data", "universities.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const universities = readJson(uniPath);
  const errors = [];

  for (const university of universities) {
    if (university?.logo) {
      errors.push(`${university.id}: logo field must be removed (use text initials instead)`);
    }
  }

  if (errors.length) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(`validate-university-logos: OK (${universities.length} institutions, no logo fields)`);
}

main();
