/**
 * Discover PDF and admissions links on official university websites.
 * Writes a reviewable draft — does not modify public/data/universities.json.
 *
 * Usage: node scripts/discover-university-resources.mjs
 *        node scripts/discover-university-resources.mjs --id ub
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchHtml } from "./lib/htmlFetch.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const targetsPath = path.join(__dirname, "data", "targets", "institutions-55.json");
const uniPath = path.join(root, "public/data/universities.json");
const outPath = path.join(__dirname, "data", "drafts", "university-resources-draft.json");

const PRIORITY_PATH_RE =
  /admission|apply|prospectus|download|study|fees|calendar|almanac|brochure|undergraduate|enrol/i;
const NEGATIVE_RE = /cv|curriculum-vitae|annual-report|staff|newsletter|privacy|logo/i;
const DOC_EXT_RE = /\.(pdf|docx?)(\?|#|$)/i;

const MAX_PAGES = 12;
const MAX_DEPTH = 2;

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function resolveTargetId(row) {
  return row.mergeIntoExistingUniversityId || row.id;
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

function normalizeHref(href, baseUrl) {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

function sameHost(a, b) {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

function suggestCategory(url, title) {
  const t = `${url} ${title}`.toLowerCase();
  if (/prospectus|brochure|handbook/.test(t)) return "Prospectus";
  if (/almanac|calendar|timetable/.test(t)) return "Calendar";
  if (/fee|financial|payment|bursar/.test(t)) return "Fees";
  if (/how.?to.?apply|step|online.?application|apply.?now/.test(t)) return "How to apply";
  if (/guide|requirement|entry/.test(t)) return "Application guide";
  if (/admission|apply|enrol/.test(t)) return "Admissions page";
  if (DOC_EXT_RE.test(url)) return "Brochure";
  return "Admissions page";
}

function scoreCandidate(url, title) {
  const t = `${url} ${title}`.toLowerCase();
  if (NEGATIVE_RE.test(t)) return -10;
  let score = 0;
  if (DOC_EXT_RE.test(url)) score += 5;
  if (PRIORITY_PATH_RE.test(t)) score += 3;
  if (title.length > 8) score += 1;
  return score;
}

function extractLinks(dom, pageUrl) {
  const out = [];
  for (const a of dom.querySelectorAll("a[href]")) {
    const href = normalizeHref(a.getAttribute("href"), pageUrl);
    if (!href || !sameHost(href, pageUrl)) continue;
    const title = (a.textContent || a.getAttribute("title") || "").replace(/\s+/g, " ").trim();
    if (!title || title.length < 4) continue;
    if (!PRIORITY_PATH_RE.test(href) && !PRIORITY_PATH_RE.test(title) && !DOC_EXT_RE.test(href)) continue;
    const score = scoreCandidate(href, title);
    if (score < 1) continue;
    out.push({
      title: title.slice(0, 160),
      url: href,
      suggestedCategory: suggestCategory(href, title),
      format: DOC_EXT_RE.test(href) ? "PDF" : "Web page",
      score,
    });
  }
  return out;
}

async function crawlWebsite(startUrl) {
  const seen = new Set();
  const queue = [{ url: startUrl, depth: 0 }];
  const candidates = new Map();

  while (queue.length && seen.size < MAX_PAGES) {
    const { url, depth } = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);

    let page;
    try {
      page = await fetchHtml(url, { timeoutMs: 12000 });
    } catch (e) {
      return { error: String(e.message || e), candidates: [...candidates.values()] };
    }

    for (const c of extractLinks(page.dom, page.url)) {
      const key = c.url;
      const prev = candidates.get(key);
      if (!prev || c.score > prev.score) candidates.set(key, c);
    }

    if (depth >= MAX_DEPTH) continue;
    for (const a of page.dom.querySelectorAll("a[href]")) {
      const href = normalizeHref(a.getAttribute("href"), page.url);
      if (!href || !sameHost(href, startUrl) || seen.has(href)) continue;
      if (!PRIORITY_PATH_RE.test(href)) continue;
      queue.push({ url: href, depth: depth + 1 });
    }
  }

  return {
    error: null,
    candidates: [...candidates.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(({ score, ...rest }) => rest),
  };
}

async function main() {
  const onlyId = process.argv.includes("--id") ? process.argv[process.argv.indexOf("--id") + 1] : null;
  const targets = readJson(targetsPath);
  const universities = readJson(uniPath);
  const byId = Object.fromEntries(universities.map((u) => [u.id, u]));

  let rows = targets;
  if (onlyId && !targets.some((r) => resolveTargetId(r) === onlyId)) {
    const uni = byId[onlyId];
    if (!uni) {
      console.error(`Unknown university id: ${onlyId}`);
      process.exitCode = 1;
      return;
    }
    rows = [{ id: onlyId, nameCanonical: uni.name, website: uni.website }];
  }

  const draft = [];
  for (const row of rows) {
    const id = resolveTargetId(row);
    if (onlyId && id !== onlyId) continue;

    const uni = byId[id];
    const website = safeExternalUrl(row.website || uni?.website || "");
    const entry = {
      universityId: id,
      name: uni?.name || row.nameCanonical,
      website: website || null,
      fetchError: null,
      candidates: [],
    };

    if (!website || website.includes("gov.bw")) {
      entry.fetchError = website ? "Skipped gov.bw placeholder" : "No website URL";
      draft.push(entry);
      continue;
    }

    process.stderr.write(`Crawling ${id} …\n`);
    const result = await crawlWebsite(website);
    entry.fetchError = result.error;
    entry.candidates = result.candidates;
    draft.push(entry);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), institutions: draft }, null, 2));
  console.log(`Wrote ${draft.length} rows to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
