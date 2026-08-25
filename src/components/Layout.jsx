import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import AccountDrawer from "./AccountDrawer.jsx";
import BrandMark from "./BrandMark.jsx";
import BottomNav from "./BottomNav.jsx";
import DesktopSideNav from "./DesktopSideNav.jsx";
import FeedTopBar from "./FeedTopBar.jsx";
import OnboardingRedirect from "./OnboardingRedirect.jsx";
import SubscriptionAdSlot from "./SubscriptionAdSlot.jsx";
import { useScrollChrome } from "../hooks/useScrollChrome.js";
import { useAuth } from "../lib/auth.jsx";
import { FEED_CHROME_CLASSES, useFeedCompactChrome, useFeedMessageThread, useFeedRoute } from "../lib/feedChrome.jsx";
import { triggerFeedRefresh } from "../lib/feedRefresh.js";
import { fetchUnreadMessageCount } from "../lib/messaging.js";
import { fetchUnreadNotificationCount } from "../lib/notifications.js";

const desktopLinks = [
  { to: "/app", label: "Home", end: true },
  { to: "/predictor", label: "Predictor" },
  { to: "/feed", label: "Feed" },
  { to: "/programmes", label: "Programmes" },
  { to: "/compare", label: "Compare" },
  { to: "/saved", label: "Saved" },
];

function navLinkClass({ isActive }) {
  return [
    "focus-ring rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-200",
    isActive
      ? "bg-brand-700 text-white shadow-sm"
      : "text-stone-600 hover:bg-white/90 hover:text-brand-900",
  ].join(" ");
}

export default function Layout() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, "") || "/";
  const isHomeRoute = pathname === "/app";
  const isPartnerRoute = pathname === "/partner";
  const isAssistantRoute = pathname === "/assistant";
  const isFeedRoute = useFeedRoute();
  const isFeedCompact = useFeedCompactChrome();
  const isMessageThread = useFeedMessageThread();
  const scrollChromeEnabled = !isMessageThread && !isAssistantRoute;
  const hideBottomNav = isPartnerRoute || isMessageThread;
  // The rail is suppressed where it would fight the layout: the feed and assistant manage their
  // own full-height chrome, message threads go edge to edge, and /partner has its own shell.
  const showSideNav = !isFeedRoute && !isAssistantRoute && !isMessageThread && !isPartnerRoute;
  const chromeVisible = useScrollChrome({ enabled: scrollChromeEnabled });
  const headerRef = useRef(null);
  const [headerOffset, setHeaderOffset] = useState(0);
  const { user } = useAuth();
  const [messageCount, setMessageCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const loadBadgeCounts = useCallback(async () => {
    if (!user?.id) {
      setMessageCount(0);
      setNotificationCount(0);
      return;
    }
    const [messages, notifications] = await Promise.all([
      fetchUnreadMessageCount().catch(() => 0),
      fetchUnreadNotificationCount().catch(() => 0),
    ]);
    setMessageCount(messages);
    setNotificationCount(notifications);
  }, [user?.id]);

  useEffect(() => {
    if (!isFeedRoute) return undefined;
    loadBadgeCounts();
    const interval = window.setInterval(loadBadgeCounts, 60_000);
    return () => window.clearInterval(interval);
  }, [isFeedRoute, loadBadgeCounts]);

  useEffect(() => {
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) return undefined;

    if (isFeedRoute) {
      themeMeta.setAttribute("content", "#ffffff");
      document.documentElement.classList.add("feed-surface");
    } else {
      themeMeta.setAttribute("content", "#14746e");
      document.documentElement.classList.remove("feed-surface");
    }

    return () => {
      document.documentElement.classList.remove("feed-surface");
    };
  }, [isFeedRoute]);

  useEffect(() => {
    if (isMessageThread) {
      setHeaderOffset(0);
      return undefined;
    }

    const node = headerRef.current;
    if (!node) return undefined;

    const updateOffset = () => {
      setHeaderOffset(node.getBoundingClientRect().height);
    };

    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(node);
    return () => observer.disconnect();
  }, [isMessageThread, isFeedRoute, isFeedCompact, chromeVisible, location.pathname]);

  useLayoutEffect(() => {
    // Feed and Ask lock the page to a different height/overflow model than the rest of the app
    // (see the container and <main> classes below). Without resetting scroll on route change, a
    // scroll position carried over from another page collides with that different layout and the
    // page visibly snaps/resizes into place instead of opening like every other tab.
    window.scrollTo(0, 0);
  }, [pathname]);

  function handleFeedRefresh() {
    triggerFeedRefresh();
    if (window.location.pathname.replace(/\/$/, "") === "/feed") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div
      className={[
        "flex flex-col overflow-x-hidden",
        isAssistantRoute ? "h-dvh overflow-hidden" : "min-h-dvh",
        isFeedRoute ? "bg-white" : "thuto-page-bg",
        isMessageThread
          ? "pb-0"
          : hideBottomNav
            ? "pb-6"
            : "pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-6",
      ].join(" ")}
    >
      <OnboardingRedirect />
      {!isMessageThread ? (
        <header
          ref={headerRef}
          className={[
            "feed-chrome-header fixed inset-x-0 top-0 z-30 transition-transform duration-300 ease-out will-change-transform",
            chromeVisible ? "translate-y-0" : "-translate-y-full sm:translate-y-0",
            isFeedRoute
              ? `${FEED_CHROME_CLASSES} border-b border-brand-100/80`
              : "border-b border-stone-200/80 bg-[var(--thuto-surface-elevated)]/95 backdrop-blur-md",
          ].join(" ")}
        >
          <div
            className={[
              "mx-auto max-w-lg px-4 sm:max-w-6xl",
              // From lg the header spans the full width so it lines up with the side rail and the
              // widened content beneath it, instead of sitting in a narrower centred column.
              showSideNav ? "lg:max-w-none lg:px-6" : "",
              isFeedRoute ? (isFeedCompact ? "pt-0 sm:pt-1.5" : "pt-1.5") : "py-1.5",
            ].join(" ")}
          >
            <div
              className={[
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden transition-[max-height,opacity] duration-300 ease-out sm:grid-cols-[auto_minmax(0,1fr)_auto]",
                isFeedCompact && !chromeVisible
                  ? "max-h-0 opacity-0 sm:max-h-16 sm:opacity-100"
                  : "max-h-16 opacity-100",
              ].join(" ")}
            >
              <BrandMark className="min-w-0 justify-self-start" />
              <nav
                className={[
                  "hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto sm:flex",
                  // Tablets keep the inline nav; from lg the side rail replaces it.
                  showSideNav ? "lg:hidden" : "",
                ].join(" ")}
                aria-label="Primary desktop"
              >
                {desktopLinks.map(({ to, label, end }) => (
                  <NavLink key={to} to={to} end={end} className={navLinkClass}>
                    {label}
                  </NavLink>
                ))}
              </nav>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center justify-self-end">
                <AccountDrawer />
              </div>
            </div>
            {isFeedRoute ? (
              <FeedTopBar
                embedded
                compact={isFeedCompact}
                onRefresh={handleFeedRefresh}
                messageCount={messageCount}
                notificationCount={notificationCount}
              />
            ) : null}
          </div>
        </header>
      ) : null}
      {showSideNav ? <DesktopSideNav top={headerOffset} /> : null}
      <main
        className={[
          "mx-auto flex w-full flex-1 flex-col",
          isMessageThread
            ? "max-w-none px-0 pb-0 pt-0"
            : [
                isPartnerRoute ? "max-w-lg px-4 sm:max-w-6xl" : "max-w-lg px-4 sm:max-w-3xl",
                // Below lg nothing changes. From lg the column cap is dropped so pages use the
                // full screen, with left padding clearing the fixed rail (w-60 = 15rem).
                showSideNav ? "lg:max-w-none lg:pl-64 lg:pr-6 2xl:pr-10" : "",
                isFeedRoute ? "min-h-0 bg-white pb-6" : isAssistantRoute ? "min-h-0 flex-1 overflow-hidden pb-2" : "pb-6 sm:pb-8",
              ].join(" "),
        ].join(" ")}
        style={isMessageThread ? undefined : { paddingTop: headerOffset }}
      >
        <Outlet />
        {!isHomeRoute && !isPartnerRoute && !isMessageThread && !isAssistantRoute ? <SubscriptionAdSlot /> : null}
      </main>
      {!hideBottomNav ? <BottomNav visible={chromeVisible} surface={isFeedRoute ? "white" : "default"} /> : null}
    </div>
  );
}
