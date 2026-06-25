const STORAGE_KEY = "thuto.bookmarkedProgrammeIds";
export const MAX_BOOKMARKS_LEGACY = 10;

/**
 * @param {number} [max]
 */
function resolveMax(max) {
  if (typeof max === "number" && Number.isFinite(max) && max > 0) {
    return max === Infinity ? MAX_BOOKMARKS_LEGACY : max;
  }
  return 2;
}

/**
 * @returns {string[]}
 */
export function getBookmarkIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string" && x.trim() !== "");
  } catch {
    return [];
  }
}

/**
 * @param {string[]} ids
 */
function setBookmarkIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

/**
 * @param {string} programmeId
 * @param {number} [max]
 * @returns {{ ids: string[], added: boolean, atLimit: boolean }}
 */
export function addBookmark(programmeId, max) {
  const limit = resolveMax(max);
  const id = String(programmeId).trim();
  if (!id) return { ids: getBookmarkIds(), added: false, atLimit: false };
  const current = getBookmarkIds().filter((x) => x !== id);
  if (current.length >= limit) {
    return { ids: getBookmarkIds(), added: false, atLimit: true };
  }
  const next = [id, ...current].slice(0, limit);
  setBookmarkIds(next);
  return { ids: next, added: true, atLimit: false };
}

/**
 * @param {string} programmeId
 * @returns {string[]}
 */
export function removeBookmark(programmeId) {
  const id = String(programmeId).trim();
  const next = getBookmarkIds().filter((x) => x !== id);
  setBookmarkIds(next);
  return next;
}

/**
 * @param {string} programmeId
 * @param {number} [max]
 * @returns {{ bookmarked: boolean, atLimit?: boolean }}
 */
export function toggleBookmark(programmeId, max) {
  const id = String(programmeId).trim();
  if (!id) return { bookmarked: false };
  if (getBookmarkIds().includes(id)) {
    removeBookmark(id);
    return { bookmarked: false };
  }
  const result = addBookmark(id, max);
  return { bookmarked: result.added, atLimit: result.atLimit };
}

/**
 * @param {string} programmeId
 */
export function isBookmarked(programmeId) {
  const id = String(programmeId).trim();
  if (!id) return false;
  return getBookmarkIds().includes(id);
}

/**
 * @param {number} [max]
 */
export function getBookmarkLimit(max) {
  return resolveMax(max);
}

export { STORAGE_KEY };
