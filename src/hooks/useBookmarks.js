import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { getEntitlements } from "../lib/entitlements.js";
import {
  getBookmarkIds,
  getBookmarkLimit,
  STORAGE_KEY,
  toggleBookmark as toggleBookmarkStorage,
} from "../lib/bookmarks.js";
import { trackLimitHit } from "../lib/analytics.js";

/**
 * @returns {{
 *   ids: string[],
 *   toggle: (id: string) => { bookmarked: boolean, atLimit?: boolean },
 *   isBookmarked: (id: string) => boolean,
 *   max: number,
 *   atLimit: boolean,
 * }}
 */
export function useBookmarks() {
  const { profile } = useAuth();
  const { maxSavedProgrammes } = getEntitlements(profile);
  const max = getBookmarkLimit(maxSavedProgrammes);
  const [ids, setIds] = useState(() => getBookmarkIds());

  const refresh = useCallback(() => {
    setIds(getBookmarkIds());
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const toggle = useCallback(
    (id) => {
      const result = toggleBookmarkStorage(id, maxSavedProgrammes);
      if (result.atLimit) trackLimitHit("bookmarks");
      refresh();
      return result;
    },
    [maxSavedProgrammes, refresh],
  );

  const check = useCallback((id) => ids.includes(id), [ids]);
  const atLimit = maxSavedProgrammes !== Infinity && ids.length >= max;

  return { ids, toggle, isBookmarked: check, refresh, max, atLimit };
}
