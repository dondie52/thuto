/**
 * Return a browser-safe external URL for data-driven links.
 * Only absolute http(s) links are allowed; everything else is rendered non-clickable.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function safeExternalUrl(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

/**
 * Return a same-app path for data-driven React Router links.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function safeInternalPath(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "";

  try {
    const url = new URL(trimmed, "https://thuto.local");
    if (url.origin !== "https://thuto.local") return "";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "";
  }
}
