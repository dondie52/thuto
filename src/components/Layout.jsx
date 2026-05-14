import { NavLink, Outlet } from "react-router-dom";
import BrandMark from "./BrandMark.jsx";
import BottomNav from "./BottomNav.jsx";

const desktopLinks = [
  { to: "/app", label: "App", end: true },
  { to: "/assistant", label: "Assistant" },
  { to: "/fit-finder", label: "Fit Finder" },
  { to: "/predictor", label: "Predictor" },
  { to: "/programmes", label: "Programmes" },
  { to: "/saved", label: "Saved" },
  { to: "/universities", label: "Universities" },
];

function navLinkClass({ isActive }) {
  return [
    "focus-ring rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200",
    isActive
      ? "bg-brand-700 text-white shadow-sm"
      : "text-stone-600 hover:bg-white/90 hover:text-brand-900",
  ].join(" ");
}

export default function Layout() {
  return (
    <div className="thuto-page-bg flex min-h-dvh flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-6">
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-[var(--thuto-surface-elevated)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-2 px-4 py-3 sm:max-w-3xl">
          <BrandMark />
          <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Primary desktop">
            {desktopLinks.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>
          <span className="w-full text-center text-[11px] font-medium uppercase tracking-wider text-stone-500 sm:hidden">
            Botswana University Companion
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:max-w-3xl sm:py-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
