function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {Record<string, unknown>} programme
 * @returns {'phd' | 'postgraduate' | 'certificate' | 'diploma' | 'degree' | 'short_course' | 'professional' | ''}
 */
export function inferQualificationLevel(programme) {
  const explicit = normalizeText(programme.qualification);
  const text = normalizeText(programme.name);
  const combined = `${explicit} ${text}`;
  if (/mphil|phd|doctorate|doctoral/.test(combined)) return "phd";
  if (
    explicit.includes("postgraduate") ||
    /master|mba|m\.sc|m\.ed|m\.a\b|llm|post.?grad|pgd|pgde|executive master/.test(combined)
  ) {
    return "postgraduate";
  }
  if (combined.includes("short course")) return "short_course";
  if (combined.includes("certificate")) return "certificate";
  if (combined.includes("diploma")) return "diploma";
  if (
    combined.includes("undergraduate") ||
    combined.includes("degree") ||
    combined.includes("bachelor") ||
    /\bba\b|\bbsc\b|\bbeng\b|\bbcom\b/.test(combined)
  ) {
    return "degree";
  }
  if (combined.includes("professional")) return "professional";
  return "";
}

/**
 * @param {Record<string, unknown>} programme
 * @returns {boolean}
 */
export function isPostgraduateProgramme(programme) {
  const level = inferQualificationLevel(programme);
  return level === "postgraduate" || level === "phd";
}

/**
 * @param {Record<string, unknown>} programme
 * @param {'postgraduate' | 'phd' | 'pg'} levelFilter
 * @returns {boolean}
 */
export function matchesQualificationFilter(programme, levelFilter) {
  const level = inferQualificationLevel(programme);
  if (levelFilter === "phd") return level === "phd";
  if (levelFilter === "postgraduate") return level === "postgraduate";
  if (levelFilter === "pg") return level === "postgraduate" || level === "phd";
  return true;
}

/**
 * The literal level values a programme record can be edited to hold (CMS "Level" field). This is
 * a narrower, display-facing vocabulary than inferQualificationLevel's buckets above — it is what
 * gets written to `programme.qualification`, not what a filter groups by.
 */
export const PROGRAMME_LEVEL_OPTIONS = ["Certificate", "Short Course", "Diploma", "Undergraduate", "Postgraduate"];

/**
 * Bundled data uses free-text levels ("Degree", "Higher Diploma"). Map them onto
 * PROGRAMME_LEVEL_OPTIONS so existing programmes still show a level in the CMS editor.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function matchProgrammeLevel(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const exact = PROGRAMME_LEVEL_OPTIONS.find((option) => option.toLowerCase() === text.toLowerCase());
  if (exact) return exact;
  const level = inferQualificationLevel({ qualification: text });
  if (level === "degree") return "Undergraduate";
  if (level === "postgraduate" || level === "phd") return "Postgraduate";
  if (level === "diploma") return "Diploma";
  if (level === "certificate") return "Certificate";
  if (level === "short_course") return "Short Course";
  return "";
}
