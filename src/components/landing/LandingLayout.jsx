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
            to="/app"
            className="focus-ring landing-motion-press ml-1 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-800"
          >
            Open App
          </Link>
        </nav>
        <Link
          to="/app"
          className="focus-ring landing-motion-press rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-800 sm:hidden"
        >
          Open App
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
