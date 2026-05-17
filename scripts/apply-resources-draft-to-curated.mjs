/**
 * Merge top-scoring draft candidates into curated university-resources.json.
 *
 * Usage: node scripts/apply-resources-draft-to-curated.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const draftPath = path.join(__dirname, "data", "drafts", "university-resources-draft.json");
const curatedPath = path.join(__dirname, "data", "curated", "university-resources.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function toResource(c, sourceLabel) {
  return {
    title: c.title,
    category: c.suggestedCategory || "Brochure",
    url: c.url,
    format: c.format || "PDF",
    sourceLabel,
  };
}

function main() {
  const draft = readJson(draftPath);
  const curated = readJson(curatedPath);
  const draftById = Object.fromEntries((draft.institutions || []).map((r) => [r.universityId, r]));

  for (const row of curated.universities) {
    const d = draftById[row.universityId];
    if (!d?.candidates?.length) continue;

    const pdfs = d.candidates.filter((c) => /\.pdf(\?|#|$)/i.test(c.url)).slice(0, 6);
    const pages = d.candidates
      .filter((c) => !/\.pdf(\?|#|$)/i.test(c.url))
      .filter((c) => /admission|apply|prospectus|study|enrol/i.test(`${c.url} ${c.title}`))
      .slice(0, 3);

    const extras = [...pdfs, ...pages].map((c) => toResource(c, row.sourceLabel));
    const existingUrls = new Set((row.resources || []).map((r) => r.url));
    for (const r of extras) {
      if (!existingUrls.has(r.url)) {
        row.resources.push(r);
        existingUrls.add(r.url);
      }
    }
    if (row.resources.length > 8) row.resources = row.resources.slice(0, 8);
  }

  fs.writeFileSync(curatedPath, JSON.stringify(curated, null, 2) + "\n");
  console.log(`Merged draft candidates into ${curatedPath}`);
}

main();
