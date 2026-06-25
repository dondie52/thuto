function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {Record<string, unknown>} programme
 * @returns {'phd' | 'postgraduate' | 'certificate' | 'diploma' | 'degree' | 'professional' | ''}
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
  if (combined.includes("certificate")) return "certificate";
  if (combined.includes("diploma")) return "diploma";
  if (combined.includes("degree") || combined.includes("bachelor") || /\bba\b|\bbsc\b|\bbeng\b|\bbcom\b/.test(combined)) {
    return "degree";
  }
  if (combined.includes("professional") || combined.includes("short course")) return "professional";
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
