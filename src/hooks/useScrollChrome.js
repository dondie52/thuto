import { useEffect, useRef, useState } from "react";

const SCROLL_DELTA_THRESHOLD = 8;
const TOP_REVEAL_OFFSET = 48;

/**
 * Hides app chrome while the user scrolls up (content moves up) and reveals it when
 * scrolling down — same pattern as LinkedIn, Reddit, and YouTube mobile feeds.
 */
export function useScrollChrome({ enabled = true } = {}) {
  const [chromeVisible, setChromeVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
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
      } else if (delta > SCROLL_DELTA_THRESHOLD) {
        setChromeVisible(false);
      } else if (delta < -SCROLL_DELTA_THRESHOLD) {
        setChromeVisible(true);
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
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled]);

  return chromeVisible;
}
