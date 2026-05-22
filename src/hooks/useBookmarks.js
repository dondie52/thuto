import { useCallback, useEffect, useState } from "react";
import { getBookmarkIds, STORAGE_KEY, toggleBookmark as toggleBookmarkStorage } from "../lib/bookmarks.js";

/**
 * @returns {{ ids: string[], toggle: (id: string) => boolean, isBookmarked: (id: string) => boolean }}
 */
export function useBookmarks() {
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

  const toggle = useCallback((id) => {
    const nowBookmarked = toggleBookmarkStorage(id);
    refresh();
    return nowBookmarked;
  }, [refresh]);

  const check = useCallback((id) => ids.includes(id), [ids]);

  return { ids, toggle, isBookmarked: check, refresh };
}
