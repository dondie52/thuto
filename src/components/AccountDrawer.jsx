import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

function EmojiIcon({ emoji, label }) {
  return (
    <span className="text-xl leading-none" role="img" aria-label={label}>
      {emoji}
    </span>
  );
}

const primaryToolItems = [
  {
    to: "/feed",
    label: "Scroll Feed",
    description: "Opportunities, questions, tips, and notices",
    emoji: "◇",
  },
  {
    to: "/internships",
    label: "Internships",
    description: "Attachments and graduate programmes",
    emoji: "💼",
  },
  {
    to: "/saved",
    label: "Saved Programmes",
    description: "Your shortlisted options",
    emoji: "🤍",
  },
  {
    to: "/compare",
    label: "Compare Programmes",
    description: "Review up to three options side by side",
    emoji: "⚖️",
  },
];

const moreToolItems = [
  {
    to: "/fit-finder",
    label: "Fit Finder",
    description: "Discover programmes suited to you",
    emoji: "🔍",
  },
  {
    to: "/settings",
    label: "General Settings",
    description: "App preferences and data controls",
    emoji: "⚙️",
  },
  {
    to: "/support",
    label: "Support and Feedback",
    description: "Report a problem or share ideas",
    emoji: "💬",
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

function DrawerNavItem({ to, label, description, emoji }) {
  return (
    <NavLink to={to} className={itemClass}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
        <EmojiIcon emoji={emoji} label={label} />
      </span>
      <span className="min-w-0">
        <span className="block break-words text-sm font-semibold">{label}</span>
        <span className="block truncate text-xs text-stone-500">{description}</span>
      </span>
    </NavLink>
  );
}

export default function AccountDrawer() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [drawerError, setDrawerError] = useState("");
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const { isLoading, isPremium, logout, supabaseConfigured, user } = useAuth();

  const isSignedIn = Boolean(user);

  const profileDisplayName = useMemo(() => {
    if (isLoading) return "Account";
    if (user) {
      const fullName = user.user_metadata?.full_name?.trim();
      if (fullName) return fullName;
      const emailLocal = user.email?.split("@")[0]?.trim();
      if (emailLocal) return emailLocal;
      return "Student";
    }
    return "Sign in";
  }, [isLoading, user]);

  const profileLinkTo = isSignedIn ? "/settings" : "/auth?mode=login";

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

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
        className="focus-ring relative z-40 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-900 shadow-md transition hover:border-brand-300 hover:bg-brand-100 hover:shadow-lg"
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {isOpen ? (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 bg-[#faf9f6] sm:bg-transparent"
          role="dialog"
          aria-modal="true"
          aria-label="Account navigation"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-[#faf9f6] sm:bg-slate-950/35 sm:backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <aside className="fixed inset-0 z-10 flex h-dvh min-h-0 w-screen max-w-none flex-col bg-[#faf9f6] shadow-2xl sm:left-auto sm:right-0 sm:w-[min(24rem,92vw)] sm:border-l sm:border-stone-200">
            <div className="shrink-0 border-b border-stone-200 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={profileLinkTo}
                  className="focus-ring min-w-0 flex-1 truncate font-display text-lg font-semibold text-brand-900 transition hover:text-brand-700"
                >
                  {profileDisplayName}
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 hover:text-brand-900"
                  aria-label="Close menu"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <nav className="space-y-1" aria-label="Tools">
                {primaryToolItems.map((item) => (
                  <DrawerNavItem key={item.to} {...item} />
                ))}
              </nav>

              <div
                className={`mt-4 rounded-2xl border p-3 shadow-sm ${
                  isPremium ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    isPremium ? "text-emerald-800" : "text-amber-800"
                  }`}
                >
                  {isPremium ? "Pro active" : "Upgrade"}
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-900">Thuto Pro</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  {isPremium
                    ? "PDF downloads, WhatsApp support, and unlimited tools are unlocked."
                    : "Download programme breakdowns, get WhatsApp support, and unlock unlimited tools to finalise your applications."}
                </p>
                <Link
                  to={isPremium ? "/settings" : "/upgrade"}
                  className="focus-ring mt-3 inline-flex min-h-[40px] w-full items-center justify-center rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-900"
                >
                  {isPremium ? "Manage plan" : "Upgrade to Pro — P59"}
                </Link>
              </div>

              <nav className="mt-4 space-y-1" aria-label="More tools">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">More tools</p>
                {moreToolItems.map((item) => (
                  <DrawerNavItem key={item.to} {...item} />
                ))}
              </nav>
            </div>

            <div className="shrink-0 border-t border-stone-200 bg-white/70 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
              {!supabaseConfigured ? (
                <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                  Account login is not configured yet. You can still browse programmes on this device.
                </p>
              ) : null}
              {drawerError ? (
                <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
                  {drawerError}
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-2 text-center text-sm text-stone-500">Checking account...</p>
              ) : isSignedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="focus-ring inline-flex min-h-[42px] w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Log out
                </button>
              ) : (
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
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
