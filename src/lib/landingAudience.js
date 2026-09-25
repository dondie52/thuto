/** Which landing-page story a visitor sees at "/": student or institution. */
export const LANDING_AUDIENCES = {
  STUDENT: "student",
  INSTITUTION: "institution",
};

export const DEFAULT_LANDING_AUDIENCE = LANDING_AUDIENCES.STUDENT;

export const LANDING_AUDIENCE_STORAGE_KEY = "thuto_landing_audience";

const VALID = new Set(Object.values(LANDING_AUDIENCES));

/**
 * @param {unknown} value
 * @returns {'student' | 'institution' | null}
 */
export function normalizeLandingAudience(value) {
  const audience = String(value || "").trim().toLowerCase();
  if (VALID.has(audience)) return /** @type {'student' | 'institution'} */ (audience);
  return null;
}

/**
 * Reads the visitor's stored landing audience choice.
 * `null` means no choice has been made yet (first visit).
 * @returns {'student' | 'institution' | null}
 */
export function getStoredLandingAudience() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return normalizeLandingAudience(window.localStorage.getItem(LANDING_AUDIENCE_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Persist the visitor's landing audience choice.
 * @param {unknown} value
 * @returns {'student' | 'institution'}
 */
export function setLandingAudience(value) {
  const audience = normalizeLandingAudience(value) || DEFAULT_LANDING_AUDIENCE;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(LANDING_AUDIENCE_STORAGE_KEY, audience);
    } catch {
      /* ignore quota / private mode */
    }
  }
  return audience;
}
