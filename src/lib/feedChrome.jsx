import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_THRESHOLD_PX = 20;

const FeedChromeContext = createContext({
  isFeedRoute: false,
  isScrolled: false,
});

export function FeedChromeProvider({ children }) {
  const location = useLocation();
  const isFeedRoute = location.pathname.replace(/\/$/, "").startsWith("/feed");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isFeedRoute) {
      setIsScrolled(false);
      return undefined;
    }

    const onScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      setIsScrolled(false);
    };
  }, [isFeedRoute, location.pathname]);

  const value = useMemo(() => ({ isFeedRoute, isScrolled }), [isFeedRoute, isScrolled]);

  return <FeedChromeContext.Provider value={value}>{children}</FeedChromeContext.Provider>;
}

export function useFeedChrome() {
  return useContext(FeedChromeContext);
}
