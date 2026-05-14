/**
 * Merge institution list (55) into:
 * - public/data/universities.json (ensure entries exist)
 * - public/data/programmes.json (best-effort import from configured sources)
 *
 * This script is conservative:
 * - It never deletes programmes.
 * - When a programme already exists, it preserves non-empty curated fields (modules/careers/fees/minPoints/...).
 * - It does not guess modules; leaves `modules: []` unless a source explicitly provides them.
 *
 * Usage: node scripts/merge-institutions-55.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchHtml } from "./lib/htmlFetch.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const targetsPath = path.join(__dirname, "data", "targets", "institutions-55.json");
const uniPath = path.join(root, "public", "data", "universities.json");
const progPath = path.join(root, "public", "data", "programmes.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isNonEmptyArray(v) {
  return Array.isArray(v) && v.length > 0;
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Crawl BQA's Accredited NCQF-Based Learning Programmes listing and build a provider -> programmeNames map.
 * @returns {Promise<Map<string, Set<string>>>} key is normalized provider name.
 */
async function fetchBqaNcQfProgrammeMap() {
  const base = "https://www.bqa.org.bw/accredited-learning-programmes-ncqf";
  const { dom: firstDom } = await fetchHtml(`${base}?page=0`, { timeoutMs: 20000 });

  // Determine max page index by scanning pager links.
  let maxPage = 0;
  for (const a of firstDom.querySelectorAll('a[href*="page="]')) {
    const href = a.getAttribute("href") || "";
    const m = href.match(/page=(\d+)/);
    if (m) maxPage = Math.max(maxPage, parseInt(m[1], 10));
  }

  const map = new Map();

  function parseDom(dom) {
    const rows = dom.querySelectorAll("table tbody tr");
    for (const tr of rows) {
      const tds = tr.querySelectorAll("td");
      if (tds.length < 2) continue;
      const provider = String(tds[0].textContent || "").replace(/\s+/g, " ").trim();
      const programme = String(tds[1].textContent || "").replace(/\s+/g, " ").trim();
      if (!provider || !programme) continue;
      const k = norm(provider);
      const set = map.get(k) || new Set();
      set.add(programme);
      map.set(k, set);
    }
  }

  // Page 0 already fetched by fetchHtml above; parse it first, then crawl the rest.
  parseDom(firstDom);
  for (let p = 1; p <= maxPage; p++) {
    const { dom } = await fetchHtml(`${base}?page=${p}`, { timeoutMs: 20000 });
    parseDom(dom);
  }

  return map;
}

function pickFieldForName(name) {
  const n = String(name || "").toLowerCase();
  if (/(nursing|midwif|public health|health|pharmacy|clinical|medical)/.test(n)) return "Health";
  if (/(law|legal)/.test(n)) return "Law";
  if (/(engineering|electrical|civil|mechanical|mining|construction|quantity surveying)/.test(n)) return "Engineering";
  if (/(computer|computing|information technology|it\\b|network|cyber|software|systems|informatics)/.test(n)) return "Technology";
  if (/(accounting|finance|bank|business|management|marketing|procurement|economics|entrepreneur)/.test(n)) return "Business";
  if (/(education|teaching|primary|secondary|early childhood)/.test(n)) return "Education";
  if (/(agric|hortic|animal|range|forestry|environment)/.test(n)) return "Agriculture";
  if (/(science|chemistry|physics|biology|geology|mathematics|statistics)/.test(n)) return "Natural Sciences";
  return "Humanities";
}

function durationForName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("short course") || n.includes("workshop")) return { duration: "Short course", durationYears: null };
  if (n.startsWith("certificate") || n.includes("certificate in")) return { duration: "1 year", durationYears: 1 };
  if (n.startsWith("diploma") || n.includes("diploma in")) return { duration: "2 years", durationYears: 2 };
  if (n.includes("post graduate diploma") || n.includes("postgraduate diploma")) return { duration: "1 year", durationYears: 1 };
  if (n.startsWith("bachelor") || /\bb(sc|a|com|eng|ed)\b/.test(n)) return { duration: "4 years", durationYears: 4 };
  return { duration: "N/A", durationYears: null };
}

/**
 * Best-effort extraction of programme/course names from a DOM.
 * @param {import('node-html-parser').HTMLElement} dom
 * @param {{ includeKeywords?: string[], excludeKeywords?: string[], minLen?: number, maxLen?: number }} [parse]
 */
function extractProgrammeNamesFromDom(dom, parse = {}) {
  const includeKeywords = (parse.includeKeywords ?? [
    "certificate",
    "diploma",
    "degree",
    "bachelor",
    "programme",
    "program",
    "course",
    "bsc",
    "ba",
    "bcom",
    "beng"
  ]).map((s) => s.toLowerCase());
  const excludeKeywords = (parse.excludeKeywords ?? ["apply", "admissions", "contact", "fees", "home"]).map((s) =>
    s.toLowerCase(),
  );
  const minLen = parse.minLen ?? 8;
  const maxLen = parse.maxLen ?? 140;

  const raw = [];
  for (const a of dom.querySelectorAll("a")) {
    const t = String(a.textContent || "").replace(/\s+/g, " ").trim();
    if (!t) continue;
    raw.push(t);
  }
  for (const h of dom.querySelectorAll("h1, h2, h3, h4")) {
    const t = String(h.textContent || "").replace(/\s+/g, " ").trim();
    if (!t) continue;
    raw.push(t);
  }

  const out = [];
  const seen = new Set();
  for (const t of raw) {
    const lc = t.toLowerCase();
    if (t.length < minLen || t.length > maxLen) continue;
    if (excludeKeywords.some((k) => lc.includes(k))) continue;
    if (!includeKeywords.some((k) => lc.includes(k))) continue;
    const key = lc.replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function buildProgrammeRow({ universityId, universityName, universityShort, programmeName, officialUrl }) {
  const { duration, durationYears } = durationForName(programmeName);
  const field = pickFieldForName(programmeName);
  return {
    id: `${universityId}-${slugify(programmeName)}`,
    name: programmeName,
    field,
    university: universityName,
    universityShort,
    minPoints: null,
    subjectRequirements: {},
    duration,
    durationYears,
    description: `Programme at ${universityName}. Confirm entry requirements, fees, and modules with the institution.`,
    officialUrl: officialUrl || null,
    applyUrl: null,
    modules: [],
    careers: [],
    applicationDeadline: null,
    minPointsSource: null,
    minPointsTier: "manual",
    minPointsScaleVersion: 2,
    profileCompleteness: "partial",
    sponsorshipTier: "standard"
  };
}

function mergeProgramme(existing, incoming) {
  const out = { ...existing };

  // Never stomp curated fields.
  if (!isNonEmptyArray(out.modules) && isNonEmptyArray(incoming.modules)) out.modules = incoming.modules;
  if (!isNonEmptyArray(out.careers) && isNonEmptyArray(incoming.careers)) out.careers = incoming.careers;
  if (!out.fees && incoming.fees) out.fees = incoming.fees;
  if (out.minPoints == null && incoming.minPoints != null) out.minPoints = incoming.minPoints;
  if (!out.subjectRequirements || Object.keys(out.subjectRequirements).length === 0) out.subjectRequirements = incoming.subjectRequirements;

  // Fill basic metadata if missing.
  for (const k of [
    "name",
    "field",
    "duration",
    "durationYears",
    "description",
    "officialUrl",
    "applyUrl",
    "applicationDeadline",
    "qualification",
    "studyMode",
    "tags",
    "requirements",
    "campus"
  ]) {
    if (out[k] == null || out[k] === "" || (Array.isArray(out[k]) && out[k].length === 0)) {
      if (incoming[k] != null && incoming[k] !== "") out[k] = incoming[k];
    }
  }

  return out;
}

function ensureUniversityRecord(universities, target, canonicalId) {
  const existing = universities.find((u) => u?.id === canonicalId);
  if (existing) {
    // Fill missing basics only.
    if (!existing.website && target.website) existing.website = target.website;
    if (!existing.phone && target.phone) existing.phone = target.phone;
    if (!existing.location && target.location) existing.location = target.location;
    if (!existing.applyUrl && target.website) existing.applyUrl = target.website;
    if (!existing.description) existing.description = `Tertiary provider in Botswana. Verify programme details with the institution.`;
    if (!existing.sponsorshipTier) existing.sponsorshipTier = "standard";
    return { added: false, record: existing };
  }

  const record = {
    id: canonicalId,
    name: target.nameCanonical,
    location: target.location || "Botswana",
    description: `Tertiary provider in Botswana. Verify programme details with the institution.`,
    website: target.website || null,
    phone: target.phone || null,
    applicationOpen: null,
    applicationClose: null,
    academicYearStart: null,
    applyUrl: target.website || null,
    featured: false,
    sponsorshipTier: "standard"
  };
  universities.push(record);
  return { added: true, record };
}

async function importFromSources(target, canonicalId, universityName, universityShort) {
  const programmes = [];
  const warnings = [];

  for (const source of target.sources || []) {
    if (!source || typeof source !== "object") continue;
    if (source.type === "existing") continue;
    if (source.type === "html" && source.url) {
      try {
        const { dom } = await fetchHtml(source.url, { timeoutMs: source.timeoutMs ?? 15000 });
        const names = extractProgrammeNamesFromDom(dom, source.parse || {});
        for (const name of names) {
          programmes.push(
            buildProgrammeRow({
              universityId: canonicalId,
              universityName,
              universityShort,
              programmeName: name,
              officialUrl: source.url
            }),
          );
        }
      } catch (e) {
        warnings.push(`html fetch failed: ${source.url} (${e?.message || e})`);
      }
      continue;
    }
    if (source.type === "pdf") {
      warnings.push(`pdf parsing not implemented for ${source.localPath || source.url || "pdf source"}`);
      continue;
    }
    warnings.push(`unknown source type: ${source.type}`);
  }

  // De-dupe by id.
  const byId = new Map();
  for (const p of programmes) {
    if (!p?.id) continue;
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  return { programmes: [...byId.values()], warnings };
}

async function main() {
  const targets = readJson(targetsPath);
  const universities = readJson(uniPath);
  const existingProgrammes = readJson(progPath);

  const progById = new Map(existingProgrammes.map((p) => [p.id, p]));
  const beforeProgCount = existingProgrammes.length;
  const beforeUniCount = universities.length;

  // BQA NCQF programmes is the broadest public catalogue across Botswana providers.
  // We crawl it once and reuse it to seed programme lists for providers that appear there.
  let bqaMap = null;
  try {
    bqaMap = await fetchBqaNcQfProgrammeMap();
  } catch (e) {
    console.error(`merge-institutions-55: warning: could not crawl BQA NCQF programme list (${e?.message || e})`);
    bqaMap = null;
  }

  const report = [];

  for (const t of targets) {
    const canonicalId = t.mergeIntoExistingUniversityId || t.id;
    const uniRes = ensureUniversityRecord(universities, t, canonicalId);
    const universityName = uniRes.record.name;
    const universityShort = t.nameShort || uniRes.record.name;

    // Seed from BQA NCQF list when present, but only for institutions that currently have
    // no programme rows in Thuto (avoid creating noisy duplicates for already-curated universities).
    let hasAnyProgrammes = false;
    for (const id of progById.keys()) {
      if (String(id).startsWith(`${canonicalId}-`)) {
        hasAnyProgrammes = true;
        break;
      }
    }

    const bqaAliases = [...new Set([t.nameCanonical, ...(t.aliases || [])].map(norm).filter(Boolean))];
    const bqaNames = new Set();
    if (bqaMap && !hasAnyProgrammes) {
      for (const a of bqaAliases) {
        const set = bqaMap.get(a);
        if (!set) continue;
        for (const name of set) bqaNames.add(name);
      }
    }
    const bqaIncoming = [...bqaNames].map((name) =>
      buildProgrammeRow({
        universityId: canonicalId,
        universityName,
        universityShort,
        programmeName: name,
        officialUrl: "https://www.bqa.org.bw/accredited-learning-programmes-ncqf"
      }),
    );

    const { programmes: incoming, warnings } = await importFromSources(t, canonicalId, universityName, universityShort);
    const incomingAll = [...bqaIncoming, ...incoming];

    let added = 0;
    let updated = 0;
    for (const p of incomingAll) {
      const cur = progById.get(p.id);
      if (!cur) {
        progById.set(p.id, p);
        added++;
        continue;
      }
      const merged = mergeProgramme(cur, p);
      if (JSON.stringify(merged) !== JSON.stringify(cur)) {
        progById.set(p.id, merged);
        updated++;
      }
    }

    report.push({
      id: canonicalId,
      name: t.nameCanonical,
      universityAdded: uniRes.added,
      programmesAdded: added,
      programmesUpdated: updated,
      warnings
    });
  }

  // Preserve programme ordering to avoid noisy diffs: keep existing file order, append new ids at the end.
  const seen = new Set();
  const outProgrammes = [];
  for (const p of existingProgrammes) {
    if (!p?.id) continue;
    const next = progById.get(p.id) || p;
    outProgrammes.push(next);
    seen.add(p.id);
  }
  for (const [id, p] of progById.entries()) {
    if (seen.has(id)) continue;
    outProgrammes.push(p);
  }

  writeJson(uniPath, universities);
  writeJson(progPath, outProgrammes);

  const afterProgCount = outProgrammes.length;
  const afterUniCount = universities.length;

  const reportPath = path.join(__dirname, "institutions-55-merge-report.json");
  writeJson(reportPath, {
    universities: { before: beforeUniCount, after: afterUniCount, added: afterUniCount - beforeUniCount },
    programmes: { before: beforeProgCount, after: afterProgCount, added: afterProgCount - beforeProgCount },
    institutions: report
  });

  console.error(
    `merge-institutions-55: universities +${afterUniCount - beforeUniCount}, programmes +${afterProgCount - beforeProgCount} (report: ${path.relative(root, reportPath)})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
