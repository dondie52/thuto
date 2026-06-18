/**
 * Apply curated postgraduate module patches and programme-type templates
 * to programmes missing module data.
 *
 * Order:
 * 1. scripts/data/postgraduate-modules-curated.json (verified overrides)
 * 2. Programme-type templates from scripts/lib/postgraduateModuleTemplates.mjs
 *
 * Usage: node scripts/merge-postgraduate-modules-curated.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { templateForProgramme } from "./lib/postgraduateModuleTemplates.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");
const curatedPath = path.join(__dirname, "data/postgraduate-modules-curated.json");
const reportPath = path.join(__dirname, "postgraduate-modules-merge-report.txt");

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
  /** @type {Record<string, { modules: unknown[], modulesSource?: string, officialUrl?: string, applyUrl?: string, qualification?: string, tags?: string[] }>} */
  const curated = fs.existsSync(curatedPath) ? JSON.parse(fs.readFileSync(curatedPath, "utf8")) : {};
  const report = [];
  let curatedApplied = 0;
  let templateApplied = 0;
  let skipped = 0;

  for (const programme of programmes) {
    if (!isPostgraduate(programme)) continue;

    const patch = curated[programme.id];
    if (patch) {
      if (Array.isArray(patch.modules) && patch.modules.length) {
        programme.modules = patch.modules;
        programme.profileCompleteness = patch.profileCompleteness || "partial";
        if (patch.modulesSource) programme.modulesSource = patch.modulesSource;
        if (patch.officialUrl) programme.officialUrl = patch.officialUrl;
        if (patch.applyUrl) programme.applyUrl = patch.applyUrl;
        if (patch.qualification) programme.qualification = patch.qualification;
        if (patch.tags) programme.tags = [...new Set([...(programme.tags || []), ...patch.tags])];
        curatedApplied++;
        report.push(`${programme.id}: curated (${patch.modulesSource || "curated"})`);
      }
      continue;
    }

    if (hasModules(programme)) {
      skipped++;
      continue;
    }

    const template = templateForProgramme(programme);
    if (!template) {
      report.push(`${programme.id}: no template`);
      continue;
    }

    programme.modules = template.modules;
    programme.modulesSource = template.modulesSource;
    if (!programme.qualification) programme.qualification = "Postgraduate";
    programme.profileCompleteness = "partial";
    if (/mphil|phd/i.test(programme.name || "")) {
      programme.tags = [...new Set([...(programme.tags || []), "Research", /phd/i.test(programme.name || "") ? "PhD" : "MPhil"])];
    }
    templateApplied++;
    report.push(`${programme.id}: template (${template.modulesSource})`);
  }

  fs.writeFileSync(progPath, `${JSON.stringify(programmes, null, 2)}\n`);
  fs.writeFileSync(
    reportPath,
    [
      `Postgraduate modules merge`,
      `Curated applied: ${curatedApplied}`,
      `Templates applied: ${templateApplied}`,
      `Skipped (already had modules): ${skipped}`,
      "",
      ...report,
    ].join("\n"),
  );
  console.log(`Postgraduate modules: ${curatedApplied} curated, ${templateApplied} templated, ${skipped} skipped.`);
}

main();
