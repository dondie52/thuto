/**
 * Merge curated university resources into public/data/universities.json.
 *
 * Usage: node scripts/merge-university-resources.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const curatedPath = path.join(__dirname, "data", "curated", "university-resources.json");
const uniPath = path.join(root, "public/data/universities.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function safeExternalUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function normalizeResource(resource, sourceLabel) {
  const title = String(resource?.title || "").trim();
  const url = safeExternalUrl(resource?.url);
  if (!title || !url) return null;
  return {
    title,
    category: String(resource?.category || "Admissions page").trim(),
    url,
    format: String(resource?.format || (url.toLowerCase().includes(".pdf") ? "PDF" : "Web page")).trim(),
    sourceLabel: String(resource?.sourceLabel || sourceLabel || "").trim(),
  };
}

function dedupeResources(resources) {
  const seen = new Set();
  const out = [];
  for (const r of resources) {
    if (!r || seen.has(r.url)) continue;
    seen.add(r.url);
    out.push(r);
  }
  return out;
}

function main() {
  const curated = readJson(curatedPath);
  const universities = readJson(uniPath);
  const byId = Object.fromEntries(
    (curated.universities || curated).map((row) => [row.universityId || row.id, row])
  );

  let updated = 0;
  for (const uni of universities) {
    const row = byId[uni.id];
    if (!row) continue;

    const sourceLabel = row.sourceLabel || uni.name;
    const incoming = Array.isArray(row.resources) ? row.resources : [];
    const normalized = dedupeResources(
      incoming.map((r) => normalizeResource(r, sourceLabel)).filter(Boolean)
    );

    if (row.replace === false && Array.isArray(uni.resources) && uni.resources.length) {
      const merged = dedupeResources([
        ...uni.resources.map((r) => normalizeResource(r, sourceLabel)).filter(Boolean),
        ...normalized,
      ]);
      uni.resources = merged;
    } else {
      uni.resources = normalized;
    }
    updated++;
  }

  fs.writeFileSync(uniPath, JSON.stringify(universities, null, 2) + "\n");
  console.log(`Updated resources on ${updated} universities in ${uniPath}`);
}

main();
