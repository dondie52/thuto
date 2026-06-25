const STORAGE_KEY = "thuto.bookmarkedProgrammeIds";

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
 * @param {number} maxBookmarks
 */
export function getBookmarkLimit(maxBookmarks) {
  return Number.isFinite(maxBookmarks) ? maxBookmarks : Number.MAX_SAFE_INTEGER;
}

/**
 * Most-recent first. Respects tier limit for free users.
 * @param {string} programmeId
 * @param {number} [maxBookmarks]
 * @returns {{ ids: string[], added: boolean }}
 */
export function addBookmark(programmeId, maxBookmarks = Number.MAX_SAFE_INTEGER) {
  const limit = getBookmarkLimit(maxBookmarks);
  const id = String(programmeId).trim();
  if (!id) return { ids: getBookmarkIds(), added: false };
  const current = getBookmarkIds();
  if (current.includes(id)) return { ids: current, added: true };
  if (current.length >= limit) return { ids: current, added: false };
  const next = [id, ...current.filter((x) => x !== id)].slice(0, limit);
  setBookmarkIds(next);
  return { ids: next, added: true };
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
 * @param {number} [maxBookmarks]
 * @returns {boolean} true if now bookmarked
 */
export function toggleBookmark(programmeId, maxBookmarks = Number.MAX_SAFE_INTEGER) {
  const id = String(programmeId).trim();
  if (!id) return false;
  if (getBookmarkIds().includes(id)) {
    removeBookmark(id);
    return false;
  }
  return addBookmark(id, maxBookmarks).added;
}

/**
 * @param {string} programmeId
 */
export function isBookmarked(programmeId) {
  const id = String(programmeId).trim();
  if (!id) return false;
  return getBookmarkIds().includes(id);
}

export { STORAGE_KEY };
