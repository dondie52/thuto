import { Link, Outlet } from "react-router-dom";
import BrandMark from "../BrandMark.jsx";
import { LandingAuthProvider, landingTo, useLandingAuth } from "./LandingAuthContext.jsx";

function LandingHeader() {
  const { isSignedIn } = useLandingAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[var(--thuto-surface-elevated)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <BrandMark />
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Marketing">
          <Link
            to={landingTo(isSignedIn, "/programmes", "#programmes")}
            className="focus-ring landing-motion-press rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-white/80 hover:text-brand-900"
          >
            Programmes
          </Link>
          <Link
            to={landingTo(isSignedIn, "/universities", "#universities")}
            className="focus-ring landing-motion-press rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-white/80 hover:text-brand-900"
          >
            Universities
          </Link>
          <Link
            to={landingTo(isSignedIn, "/app", "#features")}
            className="focus-ring landing-motion-press rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-white/80 hover:text-brand-900"
          >
            App
          </Link>
          <Link
            to="/predictor"
            className="focus-ring landing-motion-press ml-1 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-800"
          >
            Check eligibility
          </Link>
        </nav>
        <Link
          to="/predictor"
          className="focus-ring landing-motion-press rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-800 sm:hidden"
        >
          Check eligibility
        </Link>
      </div>
    </header>
  );
}

export default function LandingLayout() {
  return (
    <LandingAuthProvider>
      <div className="thuto-page-bg flex min-h-dvh flex-col text-slate-900">
        <LandingHeader />
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </LandingAuthProvider>
  );
}
