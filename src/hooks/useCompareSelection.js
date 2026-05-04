import { useCallback, useEffect, useState } from "react";
import {
  COMPARE_SELECTION_STORAGE_KEY,
  COMPARE_SELECTION_MAX,
  getCompareIds,
  toggleCompareId as toggleCompareIdStorage,
  clearCompareIds as clearCompareIdsStorage,
} from "../lib/compareSelection.js";

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
  const [ids, setIds] = useState(() => getCompareIds());

  const refresh = useCallback(() => {
    setIds(getCompareIds());
  }, []);

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

  const toggle = useCallback((id) => {
    const result = toggleCompareIdStorage(id);
    refresh();
    dispatchChange();
    return result;
  }, [refresh]);

  const clear = useCallback(() => {
    clearCompareIdsStorage();
    refresh();
    dispatchChange();
  }, [refresh]);

  const isSelected = useCallback((id) => ids.includes(id), [ids]);

  const canAdd = ids.length < COMPARE_SELECTION_MAX;

  return { ids, toggle, clear, isSelected, canAdd, max: COMPARE_SELECTION_MAX };
}
