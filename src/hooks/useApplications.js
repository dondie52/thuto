import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { isSupabaseConfigured } from "../lib/supabase.js";
import {
  STORAGE_KEY,
  countApplicationsByStatus,
  fetchApplicationSettingsMap,
  fetchMyApplications,
  getLocalApplications,
  groupApplicationsByBucket,
  mergeLocalApplicationsToCloud,
  recordApplyClick as recordApplyClickApi,
  setSelfManagedStatus as setSelfManagedStatusApi,
  confirmExternalApplication as confirmExternalApi,
  withdrawApplication as withdrawApi,
} from "../lib/applications.js";

/**
 * Application list for the signed-in student, or the localStorage list when signed out.
 *
 * Mirrors useBookmarks: cloud when it can be, local when it cannot, and the same `storage`
 * listener so a second tab stays in step.
 */
export function useApplications() {
  const { user } = useAuth();
  const isCloud = isSupabaseConfigured() && Boolean(user);
  const [applications, setApplications] = useState(() => (isCloud ? [] : getLocalApplications()));
  const [settingsById, setSettingsById] = useState({});
  const [isLoading, setIsLoading] = useState(isCloud);
  const [error, setError] = useState(null);
  const mergedForUserRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!isCloud) {
      setApplications(getLocalApplications());
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await fetchMyApplications();
      setApplications(rows);
      setError(null);
    } catch (err) {
      // Keep whatever is on screen rather than blanking the page on a transient failure.
      setError(err instanceof Error ? err.message : "Could not load your applications.");
    } finally {
      setIsLoading(false);
    }
  }, [isCloud]);

  // Carry anything tracked while signed out into the account, once per user.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (isCloud && user?.id && mergedForUserRef.current !== user.id) {
        mergedForUserRef.current = user.id;
        try {
          await mergeLocalApplicationsToCloud();
        } catch {
          /* merging is best effort; the local copy is left alone on failure */
        }
      }
      if (!cancelled) await refresh();
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [isCloud, user?.id, refresh]);

  useEffect(() => {
    if (isCloud) return undefined;
    function onStorage(event) {
      if (event.key === STORAGE_KEY) setApplications(getLocalApplications());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [isCloud]);

  // Whether each institution takes Thuto-hosted applications, for the CTA on each card.
  useEffect(() => {
    const ids = [...new Set(applications.map((row) => row.institutionId).filter(Boolean))];
    if (!isSupabaseConfigured() || !ids.length) return undefined;
    let cancelled = false;
    fetchApplicationSettingsMap(ids).then((map) => {
      if (!cancelled) setSettingsById(map);
    });
    return () => {
      cancelled = true;
    };
  }, [applications]);

  // No realtime subscription in v1; a status change arrives on the next visit or focus.
  useEffect(() => {
    if (!isCloud) return undefined;
    function onFocus() {
      refresh();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isCloud, refresh]);

  const buckets = useMemo(() => groupApplicationsByBucket(applications), [applications]);
  const counts = useMemo(() => countApplicationsByStatus(applications), [applications]);

  const recordApplyClick = useCallback(
    async (input) => {
      const record = await recordApplyClickApi(input);
      await refresh();
      return record;
    },
    [refresh],
  );

  const setStatus = useCallback(
    async (id, status) => {
      // Optimistic, so the select does not visibly lag behind the tap.
      setApplications((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
      try {
        await setSelfManagedStatusApi(id, status);
      } finally {
        await refresh();
      }
    },
    [refresh],
  );

  const confirmExternal = useCallback(
    async (id) => {
      setApplications((current) =>
        current.map((row) => (row.id === id ? { ...row, externalConfirmed: true } : row)),
      );
      try {
        await confirmExternalApi(id);
      } finally {
        await refresh();
      }
    },
    [refresh],
  );

  const withdraw = useCallback(
    async (id) => {
      try {
        await withdrawApi(id);
      } finally {
        await refresh();
      }
    },
    [refresh],
  );

  return {
    applications,
    buckets,
    counts,
    settingsById,
    isCloud,
    isLoading,
    error,
    refresh,
    recordApplyClick,
    setStatus,
    confirmExternal,
    withdraw,
  };
}

export default useApplications;
