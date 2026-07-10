/**
 * Merge curated per-credit / faculty fee schedules into public/data/universities.json.
 *
 * Usage: node scripts/merge-university-fee-schedules.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const curatedPath = path.join(__dirname, "data", "curated", "university-fee-schedules.json");
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

function normalizeGroup(group) {
  const name = String(group?.name || "").trim();
  if (!name) return null;
  const out = {
    id: String(group.id || name).trim().toLowerCase().replace(/\s+/g, "-"),
    name,
  };
  if (Array.isArray(group.aliases) && group.aliases.length) {
    out.aliases = group.aliases.map((a) => String(a).trim()).filter(Boolean);
  }
  if (Array.isArray(group.fields) && group.fields.length) {
    out.fields = group.fields.map((f) => String(f).trim()).filter(Boolean);
  }
  if (typeof group.perCredit === "number" && Number.isFinite(group.perCredit)) {
    out.perCredit = group.perCredit;
  }
  if (typeof group.totalCredits === "number" && Number.isFinite(group.totalCredits)) {
    out.totalCredits = group.totalCredits;
  }
  if (typeof group.totalProgramme === "number" && Number.isFinite(group.totalProgramme)) {
    out.totalProgramme = group.totalProgramme;
  }
  if (typeof group.durationYears === "number" && Number.isFinite(group.durationYears)) {
    out.durationYears = group.durationYears;
  }
  const note = String(group?.note || "").trim();
  if (note) out.note = note;
  return out;
}

function normalizeFeeSchedule(schedule, sourceLabel) {
  if (!schedule || typeof schedule !== "object") return null;
  const basis = String(schedule.basis || "per_credit").trim();
  const currency = String(schedule.currency || "BWP").trim();
  const groups = (Array.isArray(schedule.groups) ? schedule.groups : [])
    .map(normalizeGroup)
    .filter(Boolean);
  if (!groups.length) return null;

  const out = {
    currency,
    basis,
    groups,
  };
  const academicYear = String(schedule.academicYear || "").trim();
  if (academicYear) out.academicYear = academicYear;
  const audience = String(schedule.audience || "").trim();
  if (audience) out.audience = audience;
  const audienceNote = String(schedule.audienceNote || "").trim();
  if (audienceNote) out.audienceNote = audienceNote;
  const description = String(schedule.description || "").trim();
  if (description) out.description = description;
  if (typeof schedule.normalSemesterCredits === "number" && Number.isFinite(schedule.normalSemesterCredits)) {
    out.normalSemesterCredits = schedule.normalSemesterCredits;
  }
  if (typeof schedule.semestersPerYear === "number" && Number.isFinite(schedule.semestersPerYear)) {
    out.semestersPerYear = schedule.semestersPerYear;
  }
  const sourceUrl = safeExternalUrl(schedule.sourceUrl);
  if (sourceUrl) out.sourceUrl = sourceUrl;
  const label = String(schedule.sourceLabel || sourceLabel || "").trim();
  if (label) out.sourceLabel = label;
  const updatedAt = String(schedule.updatedAt || "").trim();
  if (updatedAt) out.updatedAt = updatedAt;
  return out;
}

function ensureFeesResource(university, schedule) {
  if (!schedule?.sourceUrl) return;
  const resources = Array.isArray(university.resources) ? [...university.resources] : [];
  const hasFees = resources.some(
    (r) => String(r?.category || "").toLowerCase() === "fees" && safeExternalUrl(r?.url) === schedule.sourceUrl,
  );
  if (hasFees) {
    university.resources = resources;
    return;
  }
  resources.push({
    title: schedule.academicYear ? `${schedule.academicYear} fee schedule` : "Fee schedule",
    category: "Fees",
    url: schedule.sourceUrl,
    format: schedule.sourceUrl.toLowerCase().includes(".pdf") ? "PDF" : "Web page",
    sourceLabel: schedule.sourceLabel || university.name,
  });
  university.resources = resources;
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
    if (!row?.feeSchedule) continue;
    const normalized = normalizeFeeSchedule(row.feeSchedule, row.sourceLabel || uni.name);
    if (!normalized) continue;
    uni.feeSchedule = normalized;
    ensureFeesResource(uni, normalized);
    updated += 1;
  }

  fs.writeFileSync(uniPath, `${JSON.stringify(universities, null, 2)}\n`);
  console.log(`Merged fee schedules for ${updated} institution(s) into ${uniPath}`);
}

main();
