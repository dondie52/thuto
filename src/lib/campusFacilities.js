/**
 * Campus facilities, sports, and support availability for institution profiles.
 *
 * Institutions pick from the preset lists in the CMS, so values are stored as stable slugs.
 * Anything they type themselves is stored as the label verbatim — `facilityMeta` / `sportMeta`
 * fall back to the raw string, so a custom entry survives a round trip without a second field.
 */

/** @type {Record<string, { label: string, icon: string }>} */
export const CAMPUS_FACILITY_META = {
  clinic: { label: "Clinic", icon: "🩺" },
  pharmacy: { label: "Pharmacy", icon: "💊" },
  counselling: { label: "Counselling centre", icon: "💬" },
  cafeteria: { label: "Cafeteria", icon: "🍽️" },
  shops: { label: "Shops & restaurants", icon: "🛍️" },
  gym: { label: "Gym", icon: "🏋️" },
  courts: { label: "Sports courts", icon: "🏀" },
  field: { label: "Sports field", icon: "🥅" },
  library: { label: "Library", icon: "📚" },
  "computer-labs": { label: "Computer labs", icon: "💻" },
  "science-labs": { label: "Science labs", icon: "🔬" },
  bank: { label: "Bank / ATM", icon: "🏧" },
  parking: { label: "Parking", icon: "🅿️" },
  housing: { label: "Student housing", icon: "🏠" },
  "social-clubs": { label: "Social clubs", icon: "🎭" },
  chapel: { label: "Chapel / prayer room", icon: "🕊️" },
  "disability-support": { label: "Disability support", icon: "♿" },
  wifi: { label: "Campus WiFi", icon: "📶" },
  bookshop: { label: "Bookshop", icon: "📖" },
  printing: { label: "Printing & copying", icon: "🖨️" },
};

/** @type {Record<string, { label: string, icon: string }>} */
export const CAMPUS_SPORT_META = {
  football: { label: "Football", icon: "⚽" },
  rugby: { label: "Rugby", icon: "🏉" },
  netball: { label: "Netball", icon: "🥅" },
  basketball: { label: "Basketball", icon: "🏀" },
  volleyball: { label: "Volleyball", icon: "🏐" },
  athletics: { label: "Athletics", icon: "🏃" },
  cricket: { label: "Cricket", icon: "🏏" },
  tennis: { label: "Tennis", icon: "🎾" },
  "table-tennis": { label: "Table tennis", icon: "🏓" },
  badminton: { label: "Badminton", icon: "🏸" },
  swimming: { label: "Swimming", icon: "🏊" },
  boxing: { label: "Boxing", icon: "🥊" },
  "martial-arts": { label: "Martial arts", icon: "🥋" },
  chess: { label: "Chess", icon: "♟️" },
  softball: { label: "Softball", icon: "🥎" },
  handball: { label: "Handball", icon: "🤾" },
  hockey: { label: "Hockey", icon: "🏑" },
  cycling: { label: "Cycling", icon: "🚴" },
  pool: { label: "Pool / snooker", icon: "🎱" },
  darts: { label: "Darts", icon: "🎯" },
};

const DEFAULT_FACILITY_ICON = "📍";
const DEFAULT_SPORT_ICON = "🏅";

/** Availability is a string, not a boolean, so "not answered" stays distinct from "no". */
export const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Not available" },
  { value: "", label: "Not stated" },
];

/**
 * @param {unknown} value
 * @returns {"available" | "unavailable" | ""}
 */
export function normalizeAvailability(value) {
  const text = String(value || "").trim().toLowerCase();
  return text === "available" || text === "unavailable" ? text : "";
}

/**
 * @param {string} value
 * @returns {string}
 */
export function availabilityLabel(value) {
  return AVAILABILITY_OPTIONS.find((option) => option.value === normalizeAvailability(value))?.label || "Not stated";
}

/**
 * @param {Record<string, { label: string, icon: string }>} meta
 * @param {string} fallbackIcon
 */
function makeMetaLookup(meta, fallbackIcon) {
  return (/** @type {string} */ value) => {
    const key = String(value || "").trim();
    return meta[key] || { label: key, icon: fallbackIcon };
  };
}

export const facilityMeta = makeMetaLookup(CAMPUS_FACILITY_META, DEFAULT_FACILITY_ICON);
export const sportMeta = makeMetaLookup(CAMPUS_SPORT_META, DEFAULT_SPORT_ICON);

/**
 * @param {Record<string, { label: string, icon: string }>} meta
 * @returns {{ value: string, label: string }[]}
 */
function toPillOptions(meta) {
  return Object.entries(meta).map(([value, item]) => ({
    value,
    label: `${item.icon} ${item.label}`,
  }));
}

export const CAMPUS_FACILITY_OPTIONS = toPillOptions(CAMPUS_FACILITY_META);
export const CAMPUS_SPORT_OPTIONS = toPillOptions(CAMPUS_SPORT_META);

/**
 * Keeps preset slugs and custom labels, drops blanks and duplicates.
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeSelection(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const entry of value) {
    const text = String(entry || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

/** @param {unknown} value @returns {string[]} */
export function normalizeCampusFacilities(value) {
  return normalizeSelection(value);
}

/** @param {unknown} value @returns {string[]} */
export function normalizeCampusSports(value) {
  return normalizeSelection(value);
}
