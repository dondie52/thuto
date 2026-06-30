import { useLocation } from "react-router-dom";

/** Shared opaque chrome styling for the fixed feed header block (logo row + action icons). */
export const FEED_CHROME_CLASSES = "border-brand-100/80 bg-white";

export function useFeedRoute() {
  const location = useLocation();
  return location.pathname.replace(/\/$/, "").startsWith("/feed");
}
