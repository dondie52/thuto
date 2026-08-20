import { useEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import BrandMark from "../BrandMark.jsx";
import { useScrollChrome } from "../../hooks/useScrollChrome.js";
import { LandingAuthProvider, landingTo, useLandingAuth } from "./LandingAuthContext.jsx";

function LandingHeader({ headerRef }) {
  const { isSignedIn } = useLandingAuth();
  const chromeVisible = useScrollChrome();

  return (
    <header
      ref={headerRef}
      className={[
        "fixed inset-x-0 top-0 z-30 border-b border-stone-200/80 bg-[var(--thuto-surface-elevated)]/90 backdrop-blur-md transition-transform duration-300 ease-out will-change-transform",
        chromeVisible ? "translate-y-0" : "-translate-y-full",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="hidden rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-950 sm:inline-block">
            Study in Africa
          </span>
        </div>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Marketing">
          <Link
            to="#how-it-works"
            className="focus-ring landing-motion-press rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-white/80 hover:text-brand-900"
          >
            How it works
          </Link>
          <Link
            to={landingTo(isSignedIn, "/programmes", "#programmes")}
            className="focus-ring landing-motion-press rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-white/80 hover:text-brand-900"
          >
            Programmes
          </Link>
          <Link
            to={landingTo(isSignedIn, "/universities", "#universities")}
            className="focus-ring landing-motion-press rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-white/80 hover:text-brand-900"
          >
            Universities
          </Link>
          <Link
            to="/partners"
            className="focus-ring landing-motion-press rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-white/80 hover:text-brand-900"
          >
            Partners
          </Link>
          <Link
            to={isSignedIn ? "/app" : "/auth?mode=login"}
            className="focus-ring landing-motion-press ml-1 rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-brand-800"
          >
            {isSignedIn ? "Open App" : "Log in"}
          </Link>
        </nav>
        <Link
          to={isSignedIn ? "/app" : "/auth?mode=login"}
          className="focus-ring landing-motion-press flex flex-col gap-1 rounded-md p-2 sm:hidden"
          title={isSignedIn ? "Open App" : "Log in"}
        >
          <span className="block h-0.5 w-6 bg-stone-900"></span>
          <span className="block h-0.5 w-6 bg-stone-900"></span>
          <span className="block h-0.5 w-6 bg-stone-900"></span>
        </Link>
      </div>
    </header>
  );
}

export default function LandingLayout() {
  const headerRef = useRef(null);
  const [headerOffset, setHeaderOffset] = useState(0);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return undefined;

    const updateOffset = () => {
      setHeaderOffset(node.getBoundingClientRect().height);
    };

    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <LandingAuthProvider>
      <div className="thuto-page-bg flex min-h-dvh flex-col text-slate-900">
        <LandingHeader headerRef={headerRef} />
        <main className="flex flex-1 flex-col" style={{ paddingTop: headerOffset }}>
          <Outlet />
        </main>
      </div>
    </LandingAuthProvider>
  );
}
