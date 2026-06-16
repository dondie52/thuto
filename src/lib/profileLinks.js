/**
 * @param {string | null | undefined} username
 */
export function profilePath(username) {
  const value = String(username || "").trim().toLowerCase();
  if (!value) return null;
  return `/feed/u/${encodeURIComponent(value)}`;
}
