import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { getMaxBookmarks } from "../lib/premium.js";
import { getBookmarkIds, STORAGE_KEY, toggleBookmark as toggleBookmarkStorage } from "../lib/bookmarks.js";

/**
 * @returns {{
 *   ids: string[],
 *   toggle: (id: string) => boolean,
 *   isBookmarked: (id: string) => boolean,
 *   maxBookmarks: number,
 *   canAdd: boolean,
 *   atLimit: boolean,
 * }}
 */
export function useBookmarks() {
  const { isPremium } = useAuth();
  const maxBookmarks = getMaxBookmarks(isPremium);
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
      const nowBookmarked = toggleBookmarkStorage(id, maxBookmarks);
      refresh();
      return nowBookmarked;
    },
    [maxBookmarks, refresh],
  );

  const check = useCallback((id) => ids.includes(id), [ids]);
  const canAdd = useMemo(
    () => !Number.isFinite(maxBookmarks) || ids.length < maxBookmarks,
    [ids.length, maxBookmarks],
  );
  const atLimit = useMemo(
    () => Number.isFinite(maxBookmarks) && ids.length >= maxBookmarks,
    [ids.length, maxBookmarks],
  );

  return { ids, toggle, isBookmarked: check, refresh, maxBookmarks, canAdd, atLimit };
}
