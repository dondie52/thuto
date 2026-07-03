import { useLocation } from "react-router-dom";

/** Shared opaque chrome styling for the fixed feed header block (logo row + action icons). */
export const FEED_CHROME_CLASSES = "border-brand-100/80 bg-white";

function normalizePath(location) {
  return location.pathname.replace(/\/$/, "");
}

export function isFeedMessageThreadPath(path) {
  return /^\/feed\/messages\/[^/]+$/.test(path);
}

export function useFeedRoute() {
  const location = useLocation();
  return normalizePath(location).startsWith("/feed");
}

/** True when viewing an open conversation — triggers full messaging mode. */
export function useFeedMessageThread() {
  const location = useLocation();
  return isFeedMessageThreadPath(normalizePath(location));
}

/** True only on the main feed timeline — not sub-pages. */
export function useFeedHomeRoute() {
  const location = useLocation();
  return normalizePath(location) === "/feed";
}

/** True on list sub-pages — People, Chats list, Notifications, Search, profiles. NOT threads. */
export function useFeedCompactChrome() {
  const location = useLocation();
  const path = normalizePath(location);
  return path.startsWith("/feed") && path !== "/feed" && !isFeedMessageThreadPath(path);
}
