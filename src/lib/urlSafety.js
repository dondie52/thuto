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

/** Hostnames where Thuto must not host third-party documents. */
const BLOCKED_RESOURCE_HOSTS = new Set([
  "thutoapp.com",
  "www.thutoapp.com",
  "thuto.bw",
  "www.thuto.bw",
  "thuto.local",
]);

/**
 * @param {string} hostname
 * @returns {boolean}
 */
function isBlockedResourceHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (!host) return true;
  if (BLOCKED_RESOURCE_HOSTS.has(host)) return true;
  if (host.endsWith(".supabase.co")) return true;
  if (host.endsWith(".supabase.in")) return true;
  return false;
}

/**
 * Whether a resource URL may be shown to students (must be on an external institution host).
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isAllowedExternalResourceUrl(value) {
  const href = safeExternalUrl(value);
  if (!href) return false;
  try {
    return !isBlockedResourceHost(new URL(href).hostname);
  } catch {
    return false;
  }
}

/**
 * @param {string} href
 * @returns {string}
 */
export function externalHostname(href) {
  try {
    return new URL(href).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

/**
 * Build an in-app interstitial path for leaving Thuto to an external site.
 *
 * @param {string} href
 * @param {{ programmeId?: string, institutionId?: string, linkKind?: string }} [tracking]
 * @returns {string}
 */
export function externalGoPath(href, tracking = {}) {
  const safe = safeExternalUrl(href);
  if (!safe) return "";
  const params = new URLSearchParams({ to: safe });
  if (tracking.programmeId) params.set("programme", tracking.programmeId);
  if (tracking.institutionId) params.set("institution", tracking.institutionId);
  if (tracking.linkKind) params.set("kind", tracking.linkKind);
  return `/go?${params.toString()}`;
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
