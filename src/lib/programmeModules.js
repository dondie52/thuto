/**
 * Helpers for programme module/course lists stored as semester blocks in programmes.json.
 */

/** @param {unknown} name */
function moduleKey(name) {
  return String(name).trim().toLowerCase();
}

/**
 * Some records store `modules` as a flat list of strings instead of semester blocks.
 * @param {unknown[]} raw
 * @returns {{ semester: string|number, modules: unknown[] }[]}
 */
function toRawBlocks(raw) {
  if (raw.some((entry) => typeof entry === "string")) {
    return [{ semester: "", modules: raw.filter((entry) => typeof entry === "string") }];
  }
  return raw.map((block) => ({
    semester: block?.semester ?? "",
    modules: Array.isArray(block?.modules) ? block.modules : [],
  }));
}

/**
 * Source data repeats whole curriculum tables for some programmes — UB's calendar restates the
 * same courses once per degree variant, and the merge script appends each variant instead of
 * collapsing it. The repeats are regrouped rather than identical, so de-duplication has to work
 * on module names across the whole programme, keeping the first occurrence.
 *
 * Numeric semester labels are re-numbered afterwards because they were assigned by block index
 * upstream, so dropping a block would otherwise leave gaps like "Semester 1, 2, 3, 10, 14".
 * String labels ("Year 1", "Research") are left as authored.
 *
 * @param {import('./programmesData.js').Programme | Record<string, unknown> | null | undefined} programme
 * @returns {{ semester: string|number, modules: string[] }[]}
 */
export function getProgrammeModuleBlocks(programme) {
  const raw = programme?.modules;
  if (!Array.isArray(raw)) return [];

  const seen = new Set();
  const blocks = [];

  for (const block of toRawBlocks(raw)) {
    const modules = [];
    for (const name of block.modules) {
      if (!name) continue;
      const key = moduleKey(name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      modules.push(name);
    }
    if (modules.length) blocks.push({ semester: block.semester, modules });
  }

  return blocks.map((block, index) => (typeof block.semester === "number" ? { ...block, semester: index + 1 } : block));
}

/**
 * First `limit` modules, walking blocks in order. The block that crosses the limit is
 * returned partially filled so the semester grouping still reads correctly.
 *
 * @param {{ semester: string|number, modules: string[] }[]} blocks
 * @param {number} limit
 * @returns {{ semester: string|number, modules: string[] }[]}
 */
export function getProgrammeModulePreview(blocks, limit) {
  const preview = [];
  let remaining = Math.max(0, limit);
  for (const block of blocks) {
    if (remaining <= 0) break;
    preview.push({ semester: block.semester, modules: block.modules.slice(0, remaining) });
    remaining -= Math.min(block.modules.length, remaining);
  }
  return preview;
}

/**
 * @param {string|number} semester
 * @returns {string}
 */
export function formatModuleSemesterLabel(semester) {
  if (semester == null || semester === "") return "Modules";
  if (typeof semester === "number") return `Semester ${semester}`;
  const text = String(semester).trim();
  if (/^year\s/i.test(text) || /^years?\s/i.test(text) || /^final$/i.test(text) || /^research$/i.test(text)) {
    return text;
  }
  if (/^semester\s/i.test(text)) return text;
  return text;
}

/**
 * @param {import('./programmesData.js').Programme | Record<string, unknown> | null | undefined} programme
 * @returns {boolean}
 */
export function isResearchDegreeProgramme(programme) {
  const name = String(programme?.name || "").toLowerCase();
  const tags = (programme?.tags || []).map((t) => String(t).toLowerCase());
  return /mphil|phd|doctorate|doctoral/.test(name) || tags.includes("phd") || tags.includes("research");
}
