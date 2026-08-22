import { useEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import BrandMark from "../BrandMark.jsx";
import { useScrollChrome } from "../../hooks/useScrollChrome.js";
import { LandingAuthProvider, landingTo, useLandingAuth } from "./LandingAuthContext.jsx";

function LandingHeader({ headerRef, mobileMenuOpen, setMobileMenuOpen }) {
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
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="focus-ring landing-motion-press relative flex h-9 w-9 items-center justify-center rounded-md p-2 sm:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Toggle mobile menu"}
          aria-expanded={mobileMenuOpen}
        >
          <span
            className={`absolute block h-0.5 w-6 bg-stone-900 transition-transform duration-200 ease-out ${
              mobileMenuOpen ? "rotate-45" : "-translate-y-2"
            }`}
          ></span>
          <span
            className={`absolute block h-0.5 w-6 bg-stone-900 transition-opacity duration-200 ease-out ${
              mobileMenuOpen ? "opacity-0" : "opacity-100"
            }`}
          ></span>
          <span
            className={`absolute block h-0.5 w-6 bg-stone-900 transition-transform duration-200 ease-out ${
              mobileMenuOpen ? "-rotate-45" : "translate-y-2"
            }`}
          ></span>
        </button>
      </div>
    </header>
  );
}

function MobileMenu({ isOpen, onClose }) {
  const { isSignedIn } = useLandingAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-20 sm:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="thuto-page-bg relative flex h-full flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-200/80 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-slate-950">
              Study in Africa
            </span>
          </div>
          <button
            onClick={onClose}
            className="focus-ring rounded-md p-2 text-stone-600 hover:bg-stone-100"
            aria-label="Close menu"
          >
            <span className="block h-6 w-6 text-2xl">✕</span>
          </button>
        </div>
        <div className="px-4 pt-8" aria-hidden="true">
          <span className="block h-16 w-px bg-stone-300" />
          <span className="mt-6 block h-1.5 w-28 rounded-full bg-stone-400" />
        </div>
        <nav className="flex flex-col items-center gap-8 px-4 pt-10 text-center" aria-label="Mobile navigation">
          <Link
            to="#how-it-works"
            onClick={onClose}
            className="focus-ring landing-motion-press font-display text-3xl text-stone-900"
          >
            How it works
          </Link>
          <Link
            to={isSignedIn ? "/programmes" : "#programmes"}
            onClick={onClose}
            className="focus-ring landing-motion-press font-display text-3xl text-stone-900"
          >
            Programmes
          </Link>
          <Link
            to={isSignedIn ? "/universities" : "#universities"}
            onClick={onClose}
            className="focus-ring landing-motion-press font-display text-3xl text-stone-900"
          >
            Universities
          </Link>
          <Link
            to="/partners"
            onClick={onClose}
            className="focus-ring landing-motion-press font-display text-3xl text-stone-900"
          >
            Partners
          </Link>
        </nav>
        <div className="flex justify-center px-4 pt-10">
          <Link
            to={isSignedIn ? "/app" : "/auth?mode=login"}
            onClick={onClose}
            className="focus-ring landing-motion-press rounded-md bg-brand-700 px-8 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-brand-800"
          >
            {isSignedIn ? "Open App" : "Log in"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LandingLayout() {
  const headerRef = useRef(null);
  const [headerOffset, setHeaderOffset] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <LandingAuthProvider>
      <div className="thuto-page-bg flex min-h-dvh flex-col text-slate-900">
        <LandingHeader headerRef={headerRef} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex flex-1 flex-col" style={{ paddingTop: headerOffset }}>
          <Outlet />
        </main>
      </div>
    </LandingAuthProvider>
  );
}
