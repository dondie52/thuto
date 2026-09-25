import { useCallback, useState } from "react";
import { getStoredLandingAudience, setLandingAudience } from "../lib/landingAudience.js";

/**
 * Tracks which landing-page story ("student" | "institution") the visitor sees,
 * persisted in localStorage. `isFirstVisit` is true until a choice is made.
 */
export function useLandingAudience() {
  const [stored, setStored] = useState(() => getStoredLandingAudience());

  const setAudience = useCallback((value) => {
    const audience = setLandingAudience(value);
    setStored(audience);
    return audience;
  }, []);

  return {
    audience: stored || "student",
    isFirstVisit: stored === null,
    setAudience,
  };
}
