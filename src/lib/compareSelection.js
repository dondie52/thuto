/** sessionStorage key for up to 3 programme ids selected for compare */
export const COMPARE_SELECTION_STORAGE_KEY = "thuto_compare_ids";

export const COMPARE_SELECTION_MAX = 3;

/** @returns {string[]} */
export function getCompareIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(COMPARE_SELECTION_STORAGE_KEY);
    if (raw == null || raw === "") return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === "string" && id.trim() !== "").slice(0, COMPARE_SELECTION_MAX);
  } catch {
    return [];
  }
}

/** @param {string[]} ids */
export function setCompareIds(ids) {
  if (typeof window === "undefined") return;
  const next = ids.filter((id) => typeof id === "string" && id.trim() !== "").slice(0, COMPARE_SELECTION_MAX);
  if (next.length === 0) {
    sessionStorage.removeItem(COMPARE_SELECTION_STORAGE_KEY);
  } else {
    sessionStorage.setItem(COMPARE_SELECTION_STORAGE_KEY, JSON.stringify(next));
  }
}

/** @returns {boolean | null} true if now selected, false if removed, null if at limit and not toggling off */
export function toggleCompareId(id) {
  if (typeof id !== "string" || id.trim() === "") return null;
  const cur = getCompareIds();
  if (cur.includes(id)) {
    setCompareIds(cur.filter((x) => x !== id));
    return false;
  }
  if (cur.length >= COMPARE_SELECTION_MAX) return null;
  setCompareIds([...cur, id]);
  return true;
}

export function clearCompareIds() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(COMPARE_SELECTION_STORAGE_KEY);
}

export function compareSelectionHref(ids) {
  const slice = ids.slice(0, COMPARE_SELECTION_MAX);
  if (slice.length < 2) return null;
  return `/compare?ids=${encodeURIComponent(slice.join(","))}`;
}
