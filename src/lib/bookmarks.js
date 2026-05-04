const STORAGE_KEY = "thuto.bookmarkedProgrammeIds";
const MAX_BOOKMARKS = 10;

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
 * Most-recent first. If already at max, drops the oldest bookmark.
 * @param {string} programmeId
 * @returns {string[]} new ordered ids
 */
export function addBookmark(programmeId) {
  const id = String(programmeId).trim();
  if (!id) return getBookmarkIds();
  const current = getBookmarkIds().filter((x) => x !== id);
  const next = [id, ...current].slice(0, MAX_BOOKMARKS);
  setBookmarkIds(next);
  return next;
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
 * @returns {boolean} true if now bookmarked
 */
export function toggleBookmark(programmeId) {
  const id = String(programmeId).trim();
  if (!id) return false;
  if (getBookmarkIds().includes(id)) {
    removeBookmark(id);
    return false;
  }
  addBookmark(id);
  return true;
}

/**
 * @param {string} programmeId
 */
export function isBookmarked(programmeId) {
  const id = String(programmeId).trim();
  if (!id) return false;
  return getBookmarkIds().includes(id);
}

export { MAX_BOOKMARKS, STORAGE_KEY };
