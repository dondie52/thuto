import { useLayoutEffect, useRef, useState } from "react";

const SCROLL_DELTA_THRESHOLD = 8;
const TOP_REVEAL_OFFSET = 48;

/**
 * Hides app chrome while the user scrolls down and reveals it when scrolling up.
 */
export function useScrollChrome({ enabled = true } = {}) {
  const [chromeVisible, setChromeVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useLayoutEffect(() => {
    // `enabled` flips when navigating into/out of routes that manage their own chrome (Ask).
    // This has to reset chromeVisible before paint: a plain useEffect would leave it at whatever
    // the previous route left it at (e.g. hidden, if that page was scrolled down) for one visible
    // frame, so the header/bottom nav pop into place a beat after the new page is already on screen.
    if (!enabled) {
      setChromeVisible(true);
      return undefined;
    }

    setChromeVisible(true);
    lastScrollYRef.current = window.scrollY;

    function updateChrome() {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      if (currentY <= TOP_REVEAL_OFFSET) {
        setChromeVisible(true);
      } else if (delta < 0) {
        setChromeVisible(true);
      } else if (delta > SCROLL_DELTA_THRESHOLD) {
        setChromeVisible(false);
      }

      lastScrollYRef.current = currentY;
      tickingRef.current = false;
    }

    function handleScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(updateChrome);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [enabled]);

  return chromeVisible;
}
