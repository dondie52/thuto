/**
 * Merges UB semester modules from the undergraduate calendar text into public/data/programmes.json
 *
 * Regenerate calendar text (no -layout for cleaner line flow):
 *   pdftotext UndergraduateCalendar-2023-24-08282023.pdf scripts/data/ub-undergraduate-calendar-2023-24.txt
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const calPath = path.join(__dirname, "data", "ub-undergraduate-calendar-2023-24.txt");
const progPath = path.join(root, "public", "data", "programmes.json");
const aliasPath = path.join(__dirname, "ub-calendar-programme-aliases.json");
const reportPath = path.join(__dirname, "ub-modules-merge-report.txt");

const STOPWORDS = new Set([
  "bachelor",
  "of",
  "science",
  "arts",
  "degree",
  "programme",
  "the",
  "and",
  "in",
  "social",
  "business",
  "administration",
  "combined",
  "major",
  "minor",
  "single",
  "for",
  "with",
]);

function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[()'""`]/g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

function windowNorm(lines, i, w = 5) {
  return norm(lines.slice(i, Math.min(i + w, lines.length)).join(" "));
}

function significantTokens(s) {
  return new Set(
    norm(s)
      .split(" ")
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function slugTokens(id) {
  const s = id.replace(/^ub-/, "").replace(/-/g, " ");
  return s
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !/^e2/i.test(t));
}

function romanToInt(r) {
  const map = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };
  return map[r.toLowerCase()] ?? null;
}

function parseSemesterLabel(line) {
  const t = line.trim();
  let m = t.match(/^semester\s+(i{1,3}|iv|viii|vii|vi|v|ix|x)\b/i);
  if (m) return romanToInt(m[1]);
  m = t.match(/^semester\s+(\d{1,2})\b/i);
  if (m) return parseInt(m[1], 10);
  if (/^winter\s+semester/i.test(t)) return "winter";
  return null;
}

function isSemesterLine(line) {
  return parseSemesterLabel(line) !== null || /^level\s*\d+/i.test(line.trim());
}

function isNoiseLine(line) {
  const t = line.trim();
  if (!t) return true;
  if (/^--\s*\d+\s+of\s+\d+/.test(t)) return true;
  if (/^\d+$/.test(t)) return true;
  if (t.length > 200) return true;
  return false;
}

function headerScore(lines, start) {
  const slice = lines.slice(start, start + 90).join("\n");
  let score = 0;
  const semCount = (slice.match(/\bsemester\b/gi) || []).length;
  score += Math.min(semCount, 8) * 2;
  if (/level\s*100/i.test(slice)) score += 4;
  if (/\b[A-Z]{2,5}\s*\d{3}[A-Z]?\b/.test(slice)) score += 8;
  if (/programme structure/i.test(slice)) score += 2;
  const first = lines[start]?.trim() ?? "";
  if (first.length > 180) score -= 15;
  if (/^(by|the|and|or|applicants|for|in|it|as)\b/i.test(first)) score -= 20;
  if (/^•\s*bachelor/i.test(first)) score -= 8;
  return score;
}

function collectAnchors(prog, aliases) {
  const out = [];
  const a = aliases[prog.id];
  if (a?.anchors) out.push(...a.anchors);
  out.push(prog.name);
  out.push(prog.name.replace(/\s*\(Revised\)\s*/gi, "").trim());
  out.push(prog.name.replace(/\s*&\s*/gi, " and ").trim());
  const m = prog.name.match(/^bsc\s+(.+)$/i);
  if (m) out.push(`B.Sc. (${m[1]})`);
  const m2 = prog.name.match(/^ba\s+(.+)$/i);
  if (m2) out.push(`Bachelor of Arts (${m2[1]})`);
  const m3 = prog.name.match(/^beng\s+(.+)$/i);
  if (m3) out.push(`Bachelor of Engineering (${m3[1]})`);
  return [...new Set(out.map((s) => String(s).trim()).filter(Boolean))];
}

function buildLineStarts(lines) {
  const starts = [0];
  let acc = 0;
  for (const ln of lines) {
    acc += ln.length + 1;
    starts.push(acc);
  }
  return starts;
}

function offsetToLine(starts, off) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (starts[mid] <= off) lo = mid + 1;
    else hi = mid;
  }
  return Math.max(0, lo - 1);
}

function buildLineCaches(lines) {
  const win = [];
  const h = [];
  const interesting = [];
  for (let i = 0; i < lines.length; i++) {
    win[i] = windowNorm(lines, i, 6);
    h[i] = headerScore(lines, i);
    if (
      /bachelor|b\.sc\.|diploma|certificate|combined|postgraduate|post graduate|bis\s|single major|geomatics|actuarial|neuroscience|llb|mbbs|bdm|bikm|becde|bead|blme|dabs|ddss|dsw|ngos/i.test(
        win[i],
      )
    )
      interesting.push(i);
  }
  return { win, h, interesting };
}

function findBestStart(lines, caches, anchors, hasAlias, fullText, lineStarts) {
  const { win, h, interesting } = caches;
  let best = { idx: -1, score: -1e9, anchor: "" };
  const skipPos = lineStarts[3400] ?? 0;
  const tryLine = (i, anc) => {
    if (i < 0 || i >= lines.length) return;
    const lt = lines[i].trim();
    if (lt.startsWith("•") || lt.startsWith("-")) return;
    const wi = win[i];
    if (wi.length < 10) return;
    const na = norm(anc);
    if (na.length < 8) return;
    if (wi === na || (wi.includes(na) && na.length >= 10)) {
      let sc = h[i] + Math.min(na.length, 90) * 0.04;
      if (hasAlias && anchors.indexOf(anc) === 0) sc += 12;
      if (sc > best.score) best = { idx: i, score: sc, anchor: anc };
    }
  };
  for (const anc of anchors) {
    const raw = anc.trim();
    if (raw.length >= 10) {
      let pos = fullText.indexOf(raw, skipPos);
      if (pos < 0) pos = fullText.indexOf(raw.replace(/\s+/g, " "), skipPos);
      if (pos >= 0) {
        const li = offsetToLine(lineStarts, pos);
        for (let d = -3; d <= 3; d++) tryLine(li + d, anc);
      }
    }
  }
  for (const i of interesting) {
    for (const anc of anchors) tryLine(i, anc);
  }
  if (best.idx < 0) {
    for (let i = 0; i < lines.length; i++) {
      for (const anc of anchors) tryLine(i, anc);
    }
  }
  const minScore = hasAlias ? 6 : 12;
  if (best.score < minScore) return { idx: -1, score: best.score, anchor: "" };
  return best;
}

function findBestStartSlug(lines, caches, prog) {
  const toks = slugTokens(prog.id);
  if (toks.length < 3) return { idx: -1, score: -1e9 };
  const { win, h, interesting } = caches;
  let best = { idx: -1, score: -1e9 };
  for (const i of interesting) {
    const wi = win[i];
    if (wi.length < 20 || wi.length > 350) continue;
    let hit = 0;
    for (const t of toks) {
      if (wi.includes(t)) hit++;
    }
    if (hit < Math.ceil(toks.length * 0.72)) continue;
    const sc = h[i] + hit * 0.5;
    if (sc > best.score) best = { idx: i, score: sc };
  }
  if (best.score < 18) return { idx: -1, score: best.score };
  return best;
}

const CODE_ONLY = /^([A-Z]{2,6})\s*(\d{3})([A-Z]?)\s*$/;
const CODE_TITLE = /^([A-Z]{2,6})\s*(\d{3})([A-Z]?)\s+(.+)/;

function flushModule(pending, titleParts, out) {
  if (!pending || !out) return;
  const title = titleParts.join(" ").replace(/\s+/g, " ").trim();
  const m = title.match(/^(.+?)\s*(\([^)]*\d[^)]*\))\s*$/);
  const label = m ? `${pending} - ${m[1].trim()} ${m[2]}` : `${pending} - ${title}`;
  out.push(label.replace(/\s+/g, " ").trim());
}

function parenBalanced(s) {
  let o = 0;
  for (const c of s) {
    if (c === "(") o++;
    if (c === ")") o--;
    if (o < 0) return true;
  }
  return o === 0;
}

function titleComplete(joined) {
  if (!/\(\s*\d/.test(joined)) return false;
  if (!parenBalanced(joined)) return false;
  return true;
}

function findSectionEnd(lines, startIdx) {
  const sig = windowNorm(lines, startIdx, 10);
  const sigTok = significantTokens(sig);
  const max = Math.min(lines.length, startIdx + 260);
  for (let i = startIdx + 35; i < max; i++) {
    const line = lines[i].trim();
    if (/^DEPARTMENT OF\s+[A-Z]/i.test(line) && i > startIdx + 25) return i;
    if (/^FACULTY OF\s+[A-Z]/i.test(line) && i > startIdx + 40) return i;
    const win = windowNorm(lines, i, 6);
    if (win.length < 24) continue;
    if (!/bachelor|b\.sc\.|diploma|certificate|combined|post\s*graduate|postgraduate/i.test(win)) continue;
    if (!/degree programme|degree\s+programme/i.test(win)) continue;
    let common = 0;
    for (const t of significantTokens(win)) if (sigTok.has(t)) common++;
    if (common < 2) return i;
  }
  return max;
}

function parseSection(lines, startIdx, endIdx) {
  const end = Math.min(endIdx, lines.length);
  const blocks = [];
  let cur = null;
  let pendingCode = null;
  let titleParts = [];
  let inOptional = false;
  const optionalBuf = [];

  const startNewBlock = () => {
    if (cur && cur.modules.length) blocks.push(cur);
    cur = { semester: blocks.length + 1, modules: [] };
    pendingCode = null;
    titleParts = [];
    inOptional = false;
  };

  for (let i = startIdx; i < end; i++) {
    const raw = lines[i];
    const line = raw.trim();

    const sem = parseSemesterLabel(line);
    if (sem === "winter") {
      startNewBlock();
      continue;
    }
    if (sem !== null && typeof sem === "number") {
      startNewBlock();
      continue;
    }
    if (/^level\s*\d+/i.test(line) && !pendingCode) continue;

    if (/^optional courses/i.test(line)) {
      inOptional = true;
      optionalBuf.length = 0;
      pendingCode = null;
      titleParts = [];
      continue;
    }
    if (/^core courses|^core course$/i.test(line)) {
      inOptional = false;
      pendingCode = null;
      titleParts = [];
      continue;
    }
    if (inOptional && cur) {
      if (isSemesterLine(line) || /^level\s*\d+/i.test(line)) {
        if (optionalBuf.length) {
          const s = optionalBuf.join("; ").slice(0, 400);
          cur.modules.push(`Optional: ${s}`);
        }
        optionalBuf.length = 0;
        inOptional = false;
      } else {
        const m = line.match(CODE_TITLE);
        if (m) optionalBuf.push(`${m[1]}${m[2]}${m[3] || ""} ${m[4].trim()}`.slice(0, 100));
        else if (CODE_ONLY.test(line)) optionalBuf.push(line.replace(/\s+/g, ""));
        continue;
      }
    }

    if (!cur) {
      if (isSemesterLine(line)) {
        const s = parseSemesterLabel(line);
        if (s === "winter") startNewBlock();
        else if (typeof s === "number") startNewBlock();
      }
      continue;
    }

    if (isNoiseLine(line)) continue;
    if (/^(entry requirements|assessment|progression|award of|entrance requirements|aim and|course requirements)/i.test(line))
      continue;

    let m = line.match(CODE_ONLY);
    if (m) {
      if (pendingCode && titleParts.length === 0) pendingCode = null;
      flushModule(pendingCode, titleParts, cur.modules);
      pendingCode = `${m[1]}${m[2]}${m[3] || ""}`;
      titleParts = [];
      continue;
    }
    m = line.match(CODE_TITLE);
    if (m) {
      flushModule(pendingCode, titleParts, cur.modules);
      pendingCode = `${m[1]}${m[2]}${m[3] || ""}`;
      titleParts = [m[4].trim()];
      const joined = titleParts.join(" ");
      if (titleComplete(joined)) {
        flushModule(pendingCode, titleParts, cur.modules);
        pendingCode = null;
        titleParts = [];
      }
      continue;
    }

    if (pendingCode) {
      titleParts.push(line);
      const joined = titleParts.join(" ");
      const next = lines[i + 1]?.trim() ?? "";
      const nextIsCourse = CODE_ONLY.test(next) || CODE_TITLE.test(next) || isSemesterLine(next);
      if (titleComplete(joined) && (nextIsCourse || joined.length > 180)) {
        flushModule(pendingCode, titleParts, cur.modules);
        pendingCode = null;
        titleParts = [];
      }
      continue;
    }

    if (/^[A-Za-z]/.test(line) && /\(\s*\d/.test(line) && line.length < 140 && !inOptional) {
      cur.modules.push(line.replace(/\s+/g, " ").trim());
    }
  }
  flushModule(pendingCode, titleParts, cur?.modules ?? []);
  if (cur && cur.modules.length) blocks.push(cur);

  return blocks
    .map((b, idx) => ({
      semester: idx + 1,
      modules: b.modules.filter(Boolean),
    }))
    .filter((b) => b.modules.length);
}

function main() {
  if (!fs.existsSync(calPath)) {
    console.error("Missing", calPath);
    process.exit(1);
  }
  const rawCal = fs.readFileSync(calPath, "utf8");
  const lines = rawCal.split(/\r?\n/);
  const lineStarts = buildLineStarts(lines);
  const caches = buildLineCaches(lines);
  const programmes = JSON.parse(fs.readFileSync(progPath, "utf8"));
  const aliases = fs.existsSync(aliasPath) ? JSON.parse(fs.readFileSync(aliasPath, "utf8")) : {};
  const ub = programmes.filter((p) => p.university === "University of Botswana");

  const report = [];
  const byStart = new Map();
  const idToBlocks = new Map();

  for (const prog of ub) {
    const hasAlias = Boolean(aliases[prog.id]?.anchors?.length);
    const anchors = collectAnchors(prog, aliases);
    let best = findBestStart(lines, caches, anchors, hasAlias, rawCal, lineStarts);
    if (best.idx < 0) {
      const slugTry = findBestStartSlug(lines, caches, prog);
      if (slugTry.idx >= 0 && slugTry.score > best.score) best = slugTry;
    }
    if (best.idx < 0) {
      report.push(`NO_MATCH\t${prog.id}\t${prog.name}`);
      continue;
    }
    const start = best.idx;
    if (!byStart.has(start)) {
      const sectionEnd = findSectionEnd(lines, start);
      const blocks = parseSection(lines, start, sectionEnd);
      byStart.set(start, blocks);
    }
    const blocks = byStart.get(start);
    if (!blocks.length) {
      report.push(`EMPTY_PARSE\t${prog.id}\t${prog.name}\t@${start}`);
      continue;
    }
    idToBlocks.set(prog.id, blocks);
    report.push(`OK\t${prog.id}\t${prog.name}\t@${start}\tsemesters=${blocks.length}`);
  }

  const merged = programmes.map((p) => {
    if (!idToBlocks.has(p.id)) return p;
    return { ...p, modules: idToBlocks.get(p.id) };
  });

  fs.writeFileSync(progPath, `${JSON.stringify(merged, null, 2)}\n`);
  const summary = [
    `Updated ${idToBlocks.size} UB programmes with modules`,
    `---`,
    ...report.sort(),
  ].join("\n");
  fs.writeFileSync(reportPath, `${summary}\n`);
  console.log(summary);
}

main();
