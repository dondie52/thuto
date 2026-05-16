import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

const menuItems = [
  {
    to: "/profile",
    label: "Profile",
    description: "Your saved results and preferences",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
  },
  {
    to: "/sponsorships",
    label: "Sponsorships",
    description: "Funding routes and sponsored options",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v10H4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5h8v2M8 17v2h8v-2M12 10v4M10 12h4" />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "General Settings",
    description: "App preferences and data controls",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.8 1.8 0 00.36 1.98l.05.05-2.12 2.12-.05-.05a1.8 1.8 0 00-1.98-.36 1.8 1.8 0 00-1.1 1.66V20.5h-3v-.1a1.8 1.8 0 00-1.1-1.66 1.8 1.8 0 00-1.98.36l-.05.05-2.12-2.12.05-.05A1.8 1.8 0 004.6 15a1.8 1.8 0 00-1.66-1.1H2.8v-3h.14A1.8 1.8 0 004.6 9a1.8 1.8 0 00-.36-1.98l-.05-.05 2.12-2.12.05.05A1.8 1.8 0 008.34 5.26a1.8 1.8 0 001.1-1.66V3.5h3v.1a1.8 1.8 0 001.1 1.66 1.8 1.8 0 001.98-.36l.05-.05 2.12 2.12-.05.05A1.8 1.8 0 0019.4 9a1.8 1.8 0 001.66 1.9h.14v3h-.14A1.8 1.8 0 0019.4 15z" />
      </svg>
    ),
  },
  {
    to: "/support",
    label: "Support and Feedback",
    description: "Report a problem or share ideas",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A3.5 3.5 0 017.5 2h9A3.5 3.5 0 0120 5.5v6A3.5 3.5 0 0116.5 15H10l-4.5 4v-4A3.5 3.5 0 014 11.5v-6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7.5h6M9 11h3.5" />
      </svg>
    ),
  },
];

const exploreItems = [
  {
    to: "/compare",
    label: "Compare programmes",
    description: "Review up to three options side by side",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H5v14h4V5zm10 0h-4v14h4V5z" />
      </svg>
    ),
  },
  {
    to: "/universities",
    label: "Universities",
    description: "Institutions, locations, and application timing",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v0M9 12v0M9 15v0M9 18v0" />
      </svg>
    ),
  },
  {
    to: "/fit-finder",
    label: "Fit Finder",
    description: "Rank programmes from grades and preferences",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5 9 16l10-10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M4 4h9" />
      </svg>
    ),
  },
];

function itemClass({ isActive }) {
  return [
    "focus-ring flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition",
    isActive
      ? "border-brand-200 bg-brand-50 text-brand-900 shadow-sm"
      : "border-transparent text-stone-700 hover:border-stone-200 hover:bg-white",
  ].join(" ");
}

const focusableSelector = [
  'button:not([disabled]):not([tabindex="-1"])',
  '[href]:not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export default function AccountDrawer() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [drawerError, setDrawerError] = useState("");
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const { accountMode, continueAsGuest, isLoading, logout, supabaseConfigured, user } = useAuth();

  const modeLabel = useMemo(() => {
    if (isLoading) return "Checking account...";
    if (user?.email) return "Student account";
    return accountMode === "guest" ? "Guest mode" : "Student account";
  }, [accountMode, isLoading, user?.email]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previouslyFocused = document.activeElement;

    requestAnimationFrame(() => {
      const firstFocusable = dialogRef.current?.querySelector(focusableSelector);
      firstFocusable?.focus();
    });

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll(focusableSelector) || []);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      } else {
        triggerRef.current?.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  async function handleGuestMode() {
    setDrawerError("");
    try {
      await continueAsGuest();
      setIsOpen(false);
    } catch (error) {
      setDrawerError(error.message || "Could not switch to guest mode.");
    }
  }

  async function handleLogout() {
    setDrawerError("");
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      setDrawerError(error.message || "Could not log out.");
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-100 bg-white/90 text-brand-800 shadow-sm transition hover:bg-brand-50 hover:text-brand-900"
        aria-label="Open account menu"
        aria-expanded={isOpen}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {isOpen ? (
        <div ref={dialogRef} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Account navigation">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
            aria-label="Close account menu"
            tabIndex={-1}
          />
          <aside className="absolute right-0 top-0 flex h-full w-[min(22rem,92vw)] flex-col border-l border-stone-200 bg-[var(--thuto-surface-elevated)] shadow-2xl">
            <div className="border-b border-stone-200 bg-brand-900 px-5 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Thuto account</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">{modeLabel}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-50/85">
                    {user?.email
                      ? user.email
                      : "Save your pathway, manage preferences, and keep support close."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="focus-ring-on-dark inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close account menu"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Upgrade</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">Thuto Premium</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  Unlock deeper shortlist tracking, alerts, and richer admissions guidance when premium is ready.
                </p>
                <Link
                  to="/upgrade"
                  className="focus-ring mt-3 inline-flex min-h-[40px] items-center rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-900"
                >
                  Upgrade to premium
                </Link>
              </div>

              <nav className="mt-4 space-y-1" aria-label="More tools">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">More tools</p>
                {exploreItems.map(({ to, label, description, icon }) => (
                  <NavLink key={to} to={to} className={itemClass}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                      {icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold">{label}</span>
                      <span className="block truncate text-xs text-stone-500">{description}</span>
                    </span>
                  </NavLink>
                ))}
              </nav>

              <nav className="mt-5 space-y-1" aria-label="Account">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">Account</p>
                {menuItems.map(({ to, label, description, icon }) => (
                  <NavLink key={to} to={to} className={itemClass}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                      {icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold">{label}</span>
                      <span className="block truncate text-xs text-stone-500">{description}</span>
                    </span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="border-t border-stone-200 bg-white/70 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
              {!supabaseConfigured ? (
                <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                  Account login is not configured yet. Guest mode still works on this device.
                </p>
              ) : null}
              {drawerError ? (
                <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
                  {drawerError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleGuestMode}
                className="focus-ring mb-2 inline-flex min-h-[42px] w-full items-center justify-center rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-white"
              >
                Continue as guest
              </button>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/auth?mode=signup"
                  className="focus-ring inline-flex min-h-[42px] items-center justify-center rounded-xl bg-brand-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
                >
                  Sign up
                </Link>
                <Link
                  to="/auth?mode=login"
                  className="focus-ring inline-flex min-h-[42px] items-center justify-center rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Log in
                </Link>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="focus-ring mt-2 inline-flex min-h-[42px] w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
