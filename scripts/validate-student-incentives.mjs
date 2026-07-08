/**
 * Validate studentIncentives on public/data/universities.json.
 *
 * Usage: node scripts/validate-student-incentives.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const uniPath = path.join(root, "public/data/universities.json");

const VALID_CATEGORIES = new Set(["accommodation", "laptop", "discount", "bursary", "other"]);

const BLOCKED_HOSTS = new Set([
  "thutoapp.com",
  "www.thutoapp.com",
  "thuto.bw",
  "www.thuto.bw",
  "thuto.local",
]);

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

function isAllowedSourceUrl(value) {
  const href = safeExternalUrl(value);
  if (!href) return false;
  try {
    const host = new URL(href).hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(host)) return false;
    if (host.endsWith(".supabase.co") || host.endsWith(".supabase.in")) return false;
    return true;
  } catch {
    return false;
  }
}

function main() {
  const universities = JSON.parse(fs.readFileSync(uniPath, "utf8"));
  const errors = [];

  for (const uni of universities) {
    const items = uni.studentIncentives;
    if (!items) continue;
    if (!Array.isArray(items)) {
      errors.push(`${uni.id}: studentIncentives must be an array`);
      continue;
    }
    items.forEach((item, index) => {
      const prefix = `${uni.id}[${index}]`;
      if (!item || typeof item !== "object") {
        errors.push(`${prefix}: must be an object`);
        return;
      }
      const label = String(item.label || "").trim();
      if (!label) errors.push(`${prefix}: missing label`);
      const category = String(item.category || "").trim().toLowerCase();
      if (!VALID_CATEGORIES.has(category)) {
        errors.push(`${prefix}: invalid category '${item.category}'`);
      }
      if (item.sourceUrl && !isAllowedSourceUrl(item.sourceUrl)) {
        errors.push(`${prefix}: invalid or blocked sourceUrl`);
      }
    });
  }

  if (errors.length) {
    for (const e of errors) console.error(`ERROR: ${e}`);
    process.exitCode = 1;
    return;
  }

  const withIncentives = universities.filter((u) => Array.isArray(u.studentIncentives) && u.studentIncentives.length);
  console.log(`Validated studentIncentives on ${withIncentives.length} institutions.`);
}

main();
