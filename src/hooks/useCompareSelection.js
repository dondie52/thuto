import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import {
  COMPARE_SELECTION_STORAGE_KEY,
  getCompareIds,
  toggleCompareId as toggleCompareIdStorage,
  clearCompareIds as clearCompareIdsStorage,
} from "../lib/compareSelection.js";
import { getCompareMax } from "../lib/premium.js";
import { trackLimitHit } from "../lib/analytics.js";

const CHANGE_EVENT = "thuto-compare-selection";

function dispatchChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

/**
 * @returns {{
 *   ids: string[],
 *   toggle: (id: string) => boolean | null,
 *   clear: () => void,
 *   isSelected: (id: string) => boolean,
 *   canAdd: boolean,
 *   max: number,
 * }}
 */
export function useCompareSelection() {
  const { isPremium } = useAuth();
  const max = getCompareMax(isPremium);
  const [ids, setIds] = useState(() => getCompareIds(max));

  const refresh = useCallback(() => {
    setIds(getCompareIds(max));
  }, [max]);

  useEffect(() => {
    refresh();
  }, [max, refresh]);

  useEffect(() => {
    const onChange = () => refresh();
    const onStorage = (e) => {
      if (e.key === COMPARE_SELECTION_STORAGE_KEY || e.key === null) refresh();
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const toggle = useCallback(
    (id) => {
      const result = toggleCompareIdStorage(id, max);
      if (result === null && !ids.includes(id)) trackLimitHit("compare");
      refresh();
      dispatchChange();
      return result;
    },
    [max, refresh, ids],
  );

  const clear = useCallback(() => {
    clearCompareIdsStorage();
    refresh();
    dispatchChange();
  }, [refresh]);

  const isSelected = useCallback((id) => ids.includes(id), [ids]);

  const canAdd = ids.length < max;

  return { ids, toggle, clear, isSelected, canAdd, max };
}
