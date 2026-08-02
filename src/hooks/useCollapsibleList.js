import { useEffect, useId, useState } from "react";

/**
 * Show the first `previewCount` items of a list until the reader asks for the rest.
 *
 * `resetKey` collapses the list again when the underlying content changes — a filter chip on
 * a university page, or navigating to another programme. It has to be passed explicitly: the
 * `items` array is usually rebuilt on every render, so its identity cannot signal a real change.
 *
 * @template T
 * @param {T[]} items
 * @param {number} previewCount
 * @param {unknown} [resetKey]
 */
export function useCollapsibleList(items, previewCount, resetKey) {
  const list = Array.isArray(items) ? items : [];
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  const total = list.length;
  const hiddenCount = Math.max(0, total - previewCount);
  const canCollapse = hiddenCount > 0;

  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  return {
    visible: canCollapse && !expanded ? list.slice(0, previewCount) : list,
    expanded,
    toggle: () => setExpanded((value) => !value),
    total,
    hiddenCount,
    canCollapse,
    contentId,
  };
}

export default useCollapsibleList;
