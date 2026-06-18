/**
 * Helpers for programme module/course lists stored as semester blocks in programmes.json.
 */

/**
 * @param {import('./programmesData.js').Programme | Record<string, unknown> | null | undefined} programme
 * @returns {boolean}
 */
export function programmeHasModules(programme) {
  return getProgrammeModuleBlocks(programme).some((block) => block.modules.length > 0);
}

/**
 * @param {import('./programmesData.js').Programme | Record<string, unknown> | null | undefined} programme
 * @returns {{ semester: string|number, modules: string[] }[]}
 */
export function getProgrammeModuleBlocks(programme) {
  const raw = programme?.modules;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((block) => ({
      semester: block?.semester ?? "",
      modules: Array.isArray(block?.modules) ? block.modules.filter(Boolean) : [],
    }))
    .filter((block) => block.modules.length > 0);
}

/**
 * @param {import('./programmesData.js').Programme | Record<string, unknown> | null | undefined} programme
 * @returns {number}
 */
export function countProgrammeModules(programme) {
  return getProgrammeModuleBlocks(programme).reduce((sum, block) => sum + block.modules.length, 0);
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
