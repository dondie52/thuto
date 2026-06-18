/**
 * Validate postgraduate programme module coverage.
 *
 * Usage: node scripts/validate-postgraduate-modules.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");

function isPostgraduate(programme) {
  const q = String(programme.qualification || "").toLowerCase();
  const n = String(programme.name || "").toLowerCase();
  if (q === "postgraduate") return true;
  if (/diploma|certificate|bachelor|bsc|ba\b|bcom|beng|bed\b|llb/.test(n) && !/post.?grad|pgd|pgde|executive master|master|mphil|phd|doctorate|mba|m\.sc|m\.ed|m\.a\b|mres/.test(n)) {
    return false;
  }
  return /master|mphil|phd|doctorate|mba|m\.sc|m\.ed|m\.a\b|mres|post.?grad|pgd|pgde|doctoral|llm|mmed/.test(n);
}

function hasModules(programme) {
  return Array.isArray(programme.modules) && programme.modules.some((s) => Array.isArray(s.modules) && s.modules.length > 0);
}

function main() {
  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const pg = programmes.filter(isPostgraduate);
  const withModules = pg.filter(hasModules);
  const missing = pg.filter((p) => !hasModules(p));

  console.log(`Postgraduate programmes: ${pg.length}`);
  console.log(`With modules: ${withModules.length}`);
  console.log(`Missing modules: ${missing.length}`);

  if (missing.length) {
    console.error("\nProgrammes still missing modules:");
    for (const p of missing) {
      console.error(`  - ${p.id} (${p.universityShort}): ${p.name}`);
    }
    process.exitCode = 1;
  } else {
    console.log("\nAll postgraduate programmes have module data.");
  }
}

main();
