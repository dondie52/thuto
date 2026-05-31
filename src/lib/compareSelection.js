import { COMPARE_MAX_FREE } from "./premium.js";

/** sessionStorage key for programme ids selected for compare */
export const COMPARE_SELECTION_STORAGE_KEY = "thuto_compare_ids";

/** @deprecated Use getCompareMax(isPremium) from premium.js */
export const COMPARE_SELECTION_MAX = COMPARE_MAX_FREE;

/**
 * @param {number} [max]
 * @returns {string[]}
 */
export function getCompareIds(max = COMPARE_MAX_FREE) {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(COMPARE_SELECTION_STORAGE_KEY);
    if (raw == null || raw === "") return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === "string" && id.trim() !== "").slice(0, max);
  } catch {
    return [];
  }
}

/** @param {string[]} ids @param {number} [max] */
export function setCompareIds(ids, max = COMPARE_MAX_FREE) {
  if (typeof window === "undefined") return;
  const next = ids.filter((id) => typeof id === "string" && id.trim() !== "").slice(0, max);
  if (next.length === 0) {
    sessionStorage.removeItem(COMPARE_SELECTION_STORAGE_KEY);
  } else {
    sessionStorage.setItem(COMPARE_SELECTION_STORAGE_KEY, JSON.stringify(next));
  }
}

/** @param {string} id @param {number} [max] @returns {boolean | null} */
export function toggleCompareId(id, max = COMPARE_MAX_FREE) {
  if (typeof id !== "string" || id.trim() === "") return null;
  const cur = getCompareIds(max);
  if (cur.includes(id)) {
    setCompareIds(cur.filter((x) => x !== id), max);
    return false;
  }
  if (cur.length >= max) return null;
  setCompareIds([...cur, id], max);
  return true;
}

export function clearCompareIds() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(COMPARE_SELECTION_STORAGE_KEY);
}

/** @param {string[]} ids @param {number} [max] */
export function compareSelectionHref(ids, max = COMPARE_MAX_FREE) {
  const slice = ids.slice(0, max);
  if (slice.length < 2) return null;
  return `/compare?ids=${encodeURIComponent(slice.join(","))}`;
}
