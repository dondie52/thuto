import { NavLink, Outlet } from "react-router-dom";
import AccountDrawer from "./AccountDrawer.jsx";
import BrandMark from "./BrandMark.jsx";
import BottomNav from "./BottomNav.jsx";
import OnboardingRedirect from "./OnboardingRedirect.jsx";
import { FEED_CHROME_CLASSES, useFeedRoute } from "../lib/feedChrome.jsx";

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
  const isFeedRoute = useFeedRoute();

  return (
    <div className="thuto-page-bg flex min-h-dvh flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-6">
      <OnboardingRedirect />
      <header
        className={[
          "feed-chrome-header sticky top-0 z-30",
          isFeedRoute
            ? `${FEED_CHROME_CLASSES} border-b-0`
            : "border-b border-stone-200/80 bg-[var(--thuto-surface-elevated)]/95 backdrop-blur-md",
        ].join(" ")}
      >
        <div className={["mx-auto max-w-lg px-4 sm:max-w-6xl", isFeedRoute ? "pb-0 pt-3" : "py-3"].join(" ")}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <BrandMark className="min-w-0 justify-self-start" />
            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 sm:flex" aria-label="Primary desktop">
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
          <p className="mt-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-stone-500 sm:hidden">
            Botswana University Companion
          </p>
        </div>
      </header>
      <main
        className={[
          "mx-auto w-full max-w-lg flex-1 px-4 sm:max-w-3xl",
          isFeedRoute ? "pb-6 pt-0" : "py-6 sm:py-8",
        ].join(" ")}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
