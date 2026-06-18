/**
 * Scrape module/course lists from UB graduate programme pages on ub.bw.
 * Patches public/data/programmes.json for UB postgraduate programmes.
 *
 * Skips MPhil/PhD programmes (research-phase modules set by merge-ub-graduate-programmes.mjs).
 *
 * Usage: node scripts/scrape-ub-graduate-modules.mjs
 *        node scripts/scrape-ub-graduate-modules.mjs --id ub-master-business-administration-mba
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchHtml, normalizeText } from "./lib/htmlFetch.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const progPath = path.join(root, "public/data/programmes.json");
const reportPath = path.join(__dirname, "ub-graduate-modules-scrape-report.txt");

const COURSE_CODE_RE = /\b([A-Z]{2,4}\d{3}[A-Z]?)\b\s*[-–:]?\s*([^.\n]{4,120})/g;
const SEMESTER_RE = /semester\s*(one|two|three|four|1|2|3|4|i{1,3}|iv)\b/i;
const MBA_CORE_HEADER = /compulsory core courses:\s*\n/i;
const OPTIONAL_HEADER = /^optional courses:\s*$/im;
const DISSERTATION_RE = /dissertation:\s*students must take/i;

const ROMAN = { one: 1, two: 2, three: 3, four: 4, i: 1, ii: 2, iii: 3, iv: 4 };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanTitle(raw) {
  return String(raw || "")
    .replace(/\s+/g, " ")
    .replace(/\s*\(\d+\)\s*$/, "")
    .trim();
}

function extractCourseEntries(text) {
  const entries = [];
  const seen = new Set();
  let m;
  while ((m = COURSE_CODE_RE.exec(text)) !== null) {
    const code = m[1];
    const title = cleanTitle(m[2]);
    if (title.length < 4 || /entrance qualification|general regulation/i.test(title)) continue;
    const key = code;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(`${code} - ${title}`);
  }
  return entries;
}

function extractMbaModules(text) {
  const coreIdx = text.search(MBA_CORE_HEADER);
  if (coreIdx < 0) return null;

  const afterCore = text.slice(coreIdx);
  const optMatch = afterCore.match(OPTIONAL_HEADER);
  const dissMatch = afterCore.match(DISSERTATION_RE);
  const optOffset = optMatch ? optMatch.index : -1;
  const dissOffset = dissMatch ? dissMatch.index : -1;
  const endOffset =
    optOffset > 0 && dissOffset > 0 ? Math.min(optOffset, dissOffset) : optOffset > 0 ? optOffset : dissOffset > 0 ? dissOffset : 2500;
  const coreText = afterCore.slice(0, endOffset);
  const core = extractCourseEntries(coreText);
  const modules = [];
  if (core.length) {
    const half = Math.ceil(core.length / 2);
    modules.push({ semester: 1, modules: core.slice(0, half) });
    if (core.length > half) modules.push({ semester: 2, modules: core.slice(half) });
  }
  if (dissOffset > 0 || dissMatch) {
    modules.push({ semester: "Dissertation", modules: ["Dissertation (24 credits)"] });
  }
  return modules.length ? modules : null;
}

function extractSemesterBlocks(text) {
  const lines = text.split("\n");
  /** @type {{ semester: number|string, modules: string[] }[]} */
  const blocks = [];
  let currentSem = null;
  let buffer = "";

  for (const line of lines) {
    const sm = line.match(SEMESTER_RE);
    if (sm) {
      if (currentSem != null && buffer) {
        const mods = extractCourseEntries(buffer);
        if (mods.length) blocks.push({ semester: currentSem, modules: mods });
      }
      const token = sm[1].toLowerCase();
      currentSem = ROMAN[token] ?? parseInt(token, 10) ?? currentSem;
      buffer = line;
    } else if (currentSem != null) {
      buffer += `\n${line}`;
    }
  }
  if (currentSem != null && buffer) {
    const mods = extractCourseEntries(buffer);
    if (mods.length) blocks.push({ semester: currentSem, modules: mods });
  }
  return blocks;
}

function modulesFromPageText(text, programmeName) {
  const mba = /master of business administration|mba/i.test(programmeName) ? extractMbaModules(text) : null;
  if (mba?.length) return mba;

  const semesterBlocks = extractSemesterBlocks(text);
  if (semesterBlocks.length) return semesterBlocks;

  const flat = extractCourseEntries(text);
  if (flat.length >= 3) {
    return [{ semester: 1, modules: flat }];
  }
  return null;
}

function isResearchProgramme(p) {
  return /mphil|phd|doctorate/i.test(p.name || "");
}

function isUbPostgraduate(p) {
  return (p.universityShort === "UB" || p.university === "University of Botswana") && /postgraduate|master|mphil|phd|mba|llm|mmed|executive master/i.test(`${p.qualification || ""} ${p.name || ""}`);
}

async function scrapeProgramme(programme) {
  const url = programme.officialUrl;
  if (!url) return { status: "no-url", modules: null };
  try {
    const { text } = await fetchHtml(url, { timeoutMs: 20000 });
    const normalized = normalizeText(text);
    const modules = modulesFromPageText(normalized, programme.name || "");
    if (!modules?.length) return { status: "no-modules-found", modules: null };
    return { status: "ok", modules };
  } catch (err) {
    return { status: `error: ${err.message}`, modules: null };
  }
}

async function main() {
  const idFilter = process.argv.includes("--id")
    ? process.argv[process.argv.indexOf("--id") + 1]
    : null;

  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const targets = programmes.filter((p) => {
    if (!isUbPostgraduate(p)) return false;
    if (isResearchProgramme(p)) return false;
    if (idFilter && p.id !== idFilter) return false;
    return true;
  });

  const report = [];
  let patched = 0;

  for (const p of targets) {
    const result = await scrapeProgramme(p);
    report.push(`${p.id}: ${result.status} (${result.modules?.reduce((a, s) => a + (s.modules?.length || 0), 0) || 0} modules)`);
    if (result.modules?.length) {
      p.modules = result.modules;
      p.profileCompleteness = "partial";
      patched++;
    }
    await sleep(400);
  }

  fs.writeFileSync(progPath, `${JSON.stringify(programmes, null, 2)}\n`);
  fs.writeFileSync(reportPath, `${report.join("\n")}\n`);
  console.log(`Scraped ${targets.length} UB taught graduate programmes; patched ${patched}. Report: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
