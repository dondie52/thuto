/**
 * Merge curated student incentives into public/data/universities.json.
 *
 * Usage: node scripts/merge-student-incentives.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const curatedPath = path.join(__dirname, "data", "curated", "student-incentives.json");
const uniPath = path.join(root, "public/data/universities.json");

const VALID_CATEGORIES = new Set(["accommodation", "laptop", "discount", "bursary", "other"]);

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

function normalizeIncentive(item, sourceLabel) {
  const label = String(item?.label || "").trim();
  if (!label) return null;
  const category = String(item?.category || "other").trim().toLowerCase();
  if (!VALID_CATEGORIES.has(category)) return null;
  const detail = String(item?.detail || "").trim();
  const sourceUrl = safeExternalUrl(item?.sourceUrl);
  const out = {
    category,
    label,
  };
  if (detail) out.detail = detail;
  if (sourceUrl) out.sourceUrl = sourceUrl;
  const itemSource = String(item?.sourceLabel || sourceLabel || "").trim();
  if (itemSource) out.sourceLabel = itemSource;
  return out;
}

function dedupeIncentives(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item) continue;
    const key = `${item.category}::${item.label}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function main() {
  const curated = readJson(curatedPath);
  const universities = readJson(uniPath);
  const byId = Object.fromEntries(
    (curated.universities || curated).map((row) => [row.universityId || row.id, row]),
  );

  let updated = 0;
  for (const uni of universities) {
    const row = byId[uni.id];
    if (!row) continue;

    const sourceLabel = row.sourceLabel || uni.name;
    const incoming = Array.isArray(row.studentIncentives) ? row.studentIncentives : [];
    const normalized = dedupeIncentives(
      incoming.map((item) => normalizeIncentive(item, sourceLabel)).filter(Boolean),
    );

    if (row.replace === false && Array.isArray(uni.studentIncentives) && uni.studentIncentives.length) {
      uni.studentIncentives = dedupeIncentives([
        ...uni.studentIncentives.map((item) => normalizeIncentive(item, sourceLabel)).filter(Boolean),
        ...normalized,
      ]);
    } else {
      uni.studentIncentives = normalized;
    }
    updated++;
  }

  fs.writeFileSync(uniPath, `${JSON.stringify(universities, null, 2)}\n`);
  console.log(`Updated studentIncentives on ${updated} universities in ${uniPath}`);
}

main();
