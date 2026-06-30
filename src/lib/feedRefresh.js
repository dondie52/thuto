/** @type {(() => void) | null} */
let refreshHandler = null;

/**
 * @param {() => void} fn
 */
export function registerFeedRefresh(fn) {
  refreshHandler = fn;
  return () => {
    if (refreshHandler === fn) refreshHandler = null;
  };
}

export function triggerFeedRefresh() {
  refreshHandler?.();
}
