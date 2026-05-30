/**
 * Resolves contextual cover imagery for programmes by keyword, field, or explicit override.
 * Assets live under public/programme-themes/ (bundled for offline PWA use).
 */

const THEME_DIR = "programme-themes";

/** @type {Record<string, string>} */
export const PROGRAMME_THEME_IMAGES = {
  engineering: `${THEME_DIR}/engineering.jpg`,
  "fire-safety": `${THEME_DIR}/fire-safety.jpg`,
  aviation: `${THEME_DIR}/aviation.jpg`,
  technology: `${THEME_DIR}/technology.jpg`,
  health: `${THEME_DIR}/health.jpg`,
  education: `${THEME_DIR}/education.jpg`,
  agriculture: `${THEME_DIR}/agriculture.jpg`,
  law: `${THEME_DIR}/law.jpg`,
  business: `${THEME_DIR}/business.jpg`,
  trades: `${THEME_DIR}/trades.jpg`,
  hospitality: `${THEME_DIR}/hospitality.jpg`,
  creative: `${THEME_DIR}/creative.jpg`,
  "default-bw": `${THEME_DIR}/default-bw.jpg`,
};

/** @type {Record<string, string>} */
const FIELD_TO_THEME = {
  engineering: "engineering",
  safety: "fire-safety",
  technology: "technology",
  computing: "technology",
  health: "health",
  "health sciences": "health",
  education: "education",
  agriculture: "agriculture",
  law: "law",
  business: "business",
  trades: "trades",
  hospitality: "hospitality",
  design: "creative",
  "creative arts": "creative",
  "natural sciences": "technology",
  humanities: "education",
  "social sciences": "education",
  professional: "business",
  general: "default-bw",
};

/**
 * Keyword rules evaluated on programme name + tags + interests (first match wins).
 * @type {Array<{ pattern: RegExp, theme: string }>}
 */
const KEYWORD_THEME_RULES = [
  { pattern: /\b(fire\s*safety|firefighting|firefighter|fire\s*technology|fire\s*prevention|rescue)\b/i, theme: "fire-safety" },
  { pattern: /\b(aviation|aeronautic|aircraft|pilot|airline|flight\s*training)\b/i, theme: "aviation" },
  { pattern: /\b(nursing|midwifery|clinical|pharmacy|medicine|dentistry|paramedic)\b/i, theme: "health" },
  { pattern: /\b(civil\s*engineering|mechanical\s*engineering|electrical\s*engineering|built\s*environment|surveying)\b/i, theme: "engineering" },
  { pattern: /\b(accounting|chartered|finance|commerce|economics|insurance|logistics)\b/i, theme: "business" },
  { pattern: /\b(law|legal|llb|attorney)\b/i, theme: "law" },
  { pattern: /\b(agriculture|agronomy|livestock|veterinary|horticulture)\b/i, theme: "agriculture" },
  { pattern: /\b(hospitality|tourism|culinary|hotel)\b/i, theme: "hospitality" },
  { pattern: /\b(design|multimedia|animation|fine\s*art|creative)\b/i, theme: "creative" },
  { pattern: /\b(welding|plumbing|electrical\s*installation|motor\s*vehicle|carpentry|bricklaying)\b/i, theme: "trades" },
  { pattern: /\b(computer\s*science|information\s*technology|software|data\s*science|cyber)\b/i, theme: "technology" },
  { pattern: /\b(teaching|education|pedagogy)\b/i, theme: "education" },
];

/** @type {Record<string, string>} */
const THEME_LABELS = {
  engineering: "Engineering and built environment",
  "fire-safety": "Fire safety and rescue training",
  aviation: "Aviation and flight training",
  technology: "Technology and computing",
  health: "Health sciences",
  education: "Education and teaching",
  agriculture: "Agriculture and natural resources",
  law: "Law and legal studies",
  business: "Business and commerce",
  trades: "Trades and vocational skills",
  hospitality: "Hospitality and tourism",
  creative: "Design and creative arts",
  "default-bw": "Higher education in Botswana",
};

function normalizeField(field) {
  return String(field || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function collectSearchText(programme) {
  const parts = [
    programme?.name,
    programme?.field,
    programme?.faculty,
    programme?.university,
    ...(Array.isArray(programme?.tags) ? programme.tags : []),
    ...(Array.isArray(programme?.interests) ? programme.interests : []),
  ];
  return parts.filter(Boolean).join(" ");
}

/**
 * @param {string} field
 * @returns {string}
 */
export function themeKeyFromField(field) {
  const normalized = normalizeField(field);
  if (!normalized) return "default-bw";
  return FIELD_TO_THEME[normalized] || "default-bw";
}

/**
 * @param {import('./programmesData.js').Programme | Record<string, unknown>} programme
 * @returns {string}
 */
export function resolveProgrammeThemeKey(programme) {
  if (programme?.themeKey && PROGRAMME_THEME_IMAGES[programme.themeKey]) {
    return programme.themeKey;
  }

  const explicitCover = programme?.coverImage || programme?.heroImage;
  if (explicitCover) {
    return programme?.themeKey && PROGRAMME_THEME_IMAGES[programme.themeKey]
      ? programme.themeKey
      : "default-bw";
  }

  const searchText = collectSearchText(programme);
  for (const { pattern, theme } of KEYWORD_THEME_RULES) {
    if (pattern.test(searchText)) return theme;
  }

  return themeKeyFromField(programme?.field);
}

/**
 * @param {string} [path]
 * @returns {string}
 */
export function resolveProgrammeThemeUrl(path) {
  if (!path) return "";
  const trimmed = String(path).trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = trimmed.replace(/^\//, "");
  return `${normalizedBase}${normalizedPath}`;
}

/**
 * @param {import('./programmesData.js').Programme | Record<string, unknown>} programme
 * @returns {{ themeKey: string, imagePath: string, imageUrl: string, label: string }}
 */
export function resolveProgrammeVisual(programme) {
  const themeKey = resolveProgrammeThemeKey(programme);
  const explicitCover = programme?.coverImage || programme?.heroImage;
  const imagePath = explicitCover
    ? String(explicitCover).trim()
    : PROGRAMME_THEME_IMAGES[themeKey] || PROGRAMME_THEME_IMAGES["default-bw"];
  const imageUrl = resolveProgrammeThemeUrl(imagePath);
  const label = THEME_LABELS[themeKey] || THEME_LABELS["default-bw"];
  return { themeKey, imagePath, imageUrl, label };
}
