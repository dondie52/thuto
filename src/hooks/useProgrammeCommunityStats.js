import { useCallback, useEffect, useState } from "react";
import {
  aggregateSubmissions,
  fetchSubmissionsForProgramme,
  isSupabaseConfigured,
} from "../lib/communitySubmissions.js";

/**
 * @param {string | undefined} programmeId
 */
export function useProgrammeCommunityStats(programmeId) {
  const disabled = !isSupabaseConfigured();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [stats, setStats] = useState(/** @type {ReturnType<typeof aggregateSubmissions>} */ (null));
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (disabled || !programmeId) {
      setLoading(false);
      setError(null);
      setStats(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSubmissionsForProgramme(programmeId)
      .then((rows) => {
        if (cancelled) return;
        setStats(aggregateSubmissions(rows));
      })
      .catch((e) => {
        if (cancelled) return;
        setStats(null);
        setError(e?.message ?? "Could not load community data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [disabled, programmeId, tick]);

  return { disabled, loading, error, stats, refetch };
}
