/**
 * Validate bundled university logo paths resolve to files under public/.
 *
 * Usage: node scripts/validate-university-logos.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const uniPath = path.join(root, "public", "data", "universities.json");
const publicDir = path.join(root, "public");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const universities = readJson(uniPath);
  const errors = [];
  let withLogo = 0;

  for (const university of universities) {
    const logo = typeof university?.logo === "string" ? university.logo.trim() : "";
    if (!logo) continue;
    withLogo += 1;

    if (/^https?:\/\//i.test(logo)) {
      errors.push(`${university.id}: remote logo URLs are not allowed in bundled data (${logo})`);
      continue;
    }

    const relative = logo.replace(/^\//, "");
    if (!relative.startsWith("university-logos/")) {
      errors.push(`${university.id}: logo must live under university-logos/ (got ${logo})`);
      continue;
    }

    const absolute = path.join(publicDir, relative);
    if (!fs.existsSync(absolute)) {
      errors.push(`${university.id}: missing logo file public/${relative}`);
    }
  }

  if (errors.length) {
    for (const error of errors) console.error(`ERROR: ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `validate-university-logos: OK (${universities.length} institutions, ${withLogo} with bundled logos)`,
  );
}

main();
