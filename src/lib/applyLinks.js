import { safeExternalUrl } from "./urlSafety.js";

/**
 * Append Thuto tracking params to institution apply URLs.
 * @param {unknown} rawUrl
 * @param {{ programmeId?: string, institutionId?: string, config?: Record<string, string> }} [options]
 */
export function buildTrackedApplyUrl(rawUrl, options = {}) {
  const base = safeExternalUrl(rawUrl);
  if (!base) return null;

  try {
    const url = new URL(base);
    const { programmeId, institutionId, config = {} } = options;

    if (!url.searchParams.has("utm_source")) {
      url.searchParams.set("utm_source", config.utm_source || "thuto");
    }
    if (!url.searchParams.has("utm_medium")) {
      url.searchParams.set("utm_medium", config.utm_medium || "apply");
    }
    if (!url.searchParams.has("utm_campaign") && programmeId) {
      url.searchParams.set("utm_campaign", programmeId);
    }
    if (!url.searchParams.has("thuto_institution") && institutionId) {
      url.searchParams.set("thuto_institution", institutionId);
    }

    for (const [key, value] of Object.entries(config)) {
      if (key.startsWith("utm_") || key.startsWith("thuto_")) {
        if (!url.searchParams.has(key) && value) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  } catch {
    return base;
  }
}
