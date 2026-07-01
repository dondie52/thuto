import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import AccountDrawer from "./AccountDrawer.jsx";
import BrandMark from "./BrandMark.jsx";
import BottomNav from "./BottomNav.jsx";
import FeedTopBar from "./FeedTopBar.jsx";
import OnboardingRedirect from "./OnboardingRedirect.jsx";
import SubscriptionAdSlot from "./SubscriptionAdSlot.jsx";
import { useScrollChrome } from "../hooks/useScrollChrome.js";
import { useAuth } from "../lib/auth.jsx";
import { FEED_CHROME_CLASSES, useFeedRoute } from "../lib/feedChrome.jsx";
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
  const isHomeRoute = location.pathname.replace(/\/$/, "") === "/app";
  const isFeedRoute = useFeedRoute();
  const chromeVisible = useScrollChrome({ enabled: !isHomeRoute });
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

  function handleFeedRefresh() {
    triggerFeedRefresh();
    if (window.location.pathname.replace(/\/$/, "") === "/feed") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div
      className={[
        "thuto-page-bg flex min-h-dvh flex-col",
        isHomeRoute ? "pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6" : "pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-6",
      ].join(" ")}
    >
      <OnboardingRedirect />
      <header
        className={[
          "feed-chrome-header sticky top-0 z-30 transition-transform duration-300 ease-out will-change-transform",
          chromeVisible ? "translate-y-0" : "-translate-y-full sm:translate-y-0",
          isFeedRoute
            ? `${FEED_CHROME_CLASSES} border-b border-brand-100/80`
            : "border-b border-stone-200/80 bg-[var(--thuto-surface-elevated)]/95 backdrop-blur-md",
        ].join(" ")}
      >
        <div className={["mx-auto max-w-lg px-4 sm:max-w-6xl", isFeedRoute ? "pt-3" : "py-3"].join(" ")}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <BrandMark className="min-w-0 justify-self-start" />
            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto sm:flex" aria-label="Primary desktop">
              {desktopLinks.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} className={navLinkClass}>
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center justify-self-end">
              <AccountDrawer />
            </div>
          </div>
          <p
            className={[
              "text-center text-[11px] font-medium uppercase tracking-wider text-stone-500 sm:hidden",
              isFeedRoute ? "mt-0.5" : "mt-1",
            ].join(" ")}
          >
            Botswana Tertiary Companion
          </p>
          {isFeedRoute ? (
            <FeedTopBar
              embedded
              onRefresh={handleFeedRefresh}
              messageCount={messageCount}
              notificationCount={notificationCount}
            />
          ) : null}
        </div>
      </header>
      <main
        className={[
          "mx-auto w-full max-w-lg flex-1 px-4 sm:max-w-3xl",
          isFeedRoute ? "pb-6 pt-0" : "py-6 sm:py-8",
        ].join(" ")}
      >
        <Outlet />
        {!isHomeRoute ? <SubscriptionAdSlot /> : null}
      </main>
      {!isHomeRoute ? <BottomNav visible={chromeVisible} /> : null}
    </div>
  );
}
