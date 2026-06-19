import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

function ToolIcon({ name }) {
  const icons = {
    profile: <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 21a7.5 7.5 0 0115 0" />,
    universities: <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l8-5 8 5M5.5 10h13M7 10v8M12 10v8M17 10v8M4.5 18h15M3.5 21h17" />,
    sponsorships: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M16 7.5a3.5 3.5 0 00-3.5-2H10a3 3 0 000 6h4a3 3 0 010 6h-2.5a3.5 3.5 0 01-3.5-2" />,
    internships: <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M5 8h14v10.5A1.5 1.5 0 0117.5 20h-11A1.5 1.5 0 015 18.5V8zM5 12h14" />,
    postgraduate: <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.33-3.516M12 14l-6.33-3.516M12 14v7" />,
    saved: <path strokeLinecap="round" strokeLinejoin="round" d="M6 4.75A2.75 2.75 0 018.75 2h6.5A2.75 2.75 0 0118 4.75V21l-6-3.5L6 21V4.75z" />,
    compare: <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M4 8h6M14 8h6M5 8l2 5 2-5M15 8l2 5 2-5" />,
    fit: <path strokeLinecap="round" strokeLinejoin="round" d="M10.75 18.5a7.75 7.75 0 117.75-7.75 7.75 7.75 0 01-7.75 7.75zM16.5 16.5L21 21M8.5 10.75l1.5 1.5 3.25-3.5" />,
    study: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v10.5M8.25 4.5h7.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5zM9.75 9h4.5M9.75 12h4.5" />,
    admin: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5.4c0 4.5-2.9 8.5-7 9.6-4.1-1.1-7-5.1-7-9.6V6l7-3zM9.5 12.5l1.7 1.7 3.6-4" />,
    moderation: <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v13L15.5 16h-8A2.5 2.5 0 015 13.5v-8zM8.5 8h7M8.5 11.5h4M15 11l1 1 2-2" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25A3.75 3.75 0 1112 15.75 3.75 3.75 0 0112 8.25zM19 12a7.2 7.2 0 00-.08-1l2-1.55-2-3.46-2.35.94a7.65 7.65 0 00-1.73-1L14.5 3h-5l-.34 2.93a7.65 7.65 0 00-1.73 1L5.08 5.99l-2 3.46 2 1.55a7.2 7.2 0 000 2l-2 1.55 2 3.46 2.35-.94a7.65 7.65 0 001.73 1L9.5 21h5l.34-2.93a7.65 7.65 0 001.73-1l2.35.94 2-3.46-2-1.55c.05-.33.08-.66.08-1z" />,
    support: <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5A3.5 3.5 0 018.5 2h7A3.5 3.5 0 0119 5.5v5A3.5 3.5 0 0115.5 14H11l-5 5v-5.25A3.5 3.5 0 015 10.5v-5zM9 7h6M9 10h4" />,
  };

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      {icons[name]}
    </svg>
  );
}

const primaryToolItems = [
  { to: "/profile", label: "Profile", description: "Your account, shortlist, and predictor summary", icon: "profile" },
  { to: "/universities", label: "Tertiary Institutions", description: "Institutions, locations, and application windows", icon: "universities" },
  { to: "/sponsorships", label: "Sponsorships", description: "Government sponsorship, private funding, and grants", icon: "sponsorships" },
  { to: "/internships", label: "Internships", description: "Attachments and graduate programmes", icon: "internships" },
  { to: "/postgraduate-studies", label: "Post Graduate Studies", description: "Programmes and scholarship updates", icon: "postgraduate" },
  { to: "/saved", label: "Saved Programmes", description: "Your shortlisted options", icon: "saved" },
  { to: "/compare", label: "Compare Programmes", description: "Review up to three options side by side", icon: "compare" },
];

const moreToolItems = [
  { to: "/study", label: "BGCSE Study", description: "Revision links and subject-to-programme bridges", icon: "study" },
  { to: "/fit-finder", label: "Fit Finder", description: "Discover programmes suited to you", icon: "fit" },
  { to: "/settings", label: "General Settings", description: "App preferences and data controls", icon: "settings" },
  { to: "/support", label: "Support and Feedback", description: "Report a problem or share ideas", icon: "support" },
];

const superuserToolItems = [
  { to: "/admin", label: "Control Room", description: "Operations overview, opportunities, and premium tools", icon: "admin" },
  { to: "/admin/feed", label: "Feed Moderation", description: "Approve, reject, restore, and review reports", icon: "moderation" },
];

function itemClass({ isActive }) {
  return [
    "focus-ring flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
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

function DrawerNavItem({ to, label, description, icon }) {
  return (
    <NavLink to={to} className={itemClass}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
        <ToolIcon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-semibold">{label}</span>
        <span className="line-clamp-1 block text-xs text-stone-500">{description}</span>
      </span>
    </NavLink>
  );
}

function OperatorNavItem({ to, label, description, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "focus-ring flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
          isActive
            ? "border-white/60 bg-white text-brand-900 shadow-sm"
            : "border-white/15 bg-white/10 text-white hover:border-white/40 hover:bg-white/15",
        ].join(" ")
      }
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-current">
        <ToolIcon name={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-semibold">{label}</span>
        <span className="line-clamp-1 block text-xs opacity-75">{description}</span>
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
  const { isLoading, isPremium, isSuperuser, isSuperuserLoading, logout, profile, supabaseConfigured, user } = useAuth();

  const isSignedIn = Boolean(user);

  const profileDisplayName = useMemo(() => {
    if (isLoading) return "Account";
    if (user) {
      const fullName = profile?.full_name?.trim() || user.user_metadata?.full_name?.trim();
      if (fullName) return fullName;
      const emailLocal = user.email?.split("@")[0]?.trim();
      if (emailLocal) return emailLocal;
      return "Student";
    }
    return "Sign in";
  }, [isLoading, profile?.full_name, user]);

  const profileLinkTo = isSignedIn ? "/profile" : "/auth?mode=login";

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
        className="focus-ring relative z-40 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-brand-900 shadow-sm transition hover:border-brand-300 hover:bg-brand-100"
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
          <aside className="fixed inset-0 z-10 flex h-dvh min-h-0 w-screen max-w-none flex-col bg-[#faf9f6] shadow-2xl sm:left-auto sm:right-0 sm:w-[min(26rem,92vw)] sm:border-l sm:border-stone-200">
            <div className="shrink-0 border-b border-stone-200 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={profileLinkTo}
                  className="focus-ring min-w-0 flex-1 truncate font-display text-lg font-semibold text-brand-900 transition hover:text-brand-700"
                >
                  {profileDisplayName}
                </Link>
                {isSuperuser ? (
                  <span className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-800">
                    Superuser
                  </span>
                ) : null}
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
              {isSuperuser ? (
                <div className="mb-4 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-900 via-brand-800 to-teal-700 p-3 text-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-50/80">Operator mode</p>
                  <p className="mt-1 font-display text-lg font-semibold">Thuto Ops Superuser</p>
                  <p className="mt-1 text-xs leading-relaxed text-brand-50/85">
                    Manage moderation, opportunities, and account operations with admin-only database policies.
                  </p>
                  <nav className="mt-3 grid gap-2" aria-label="Superuser tools">
                    {superuserToolItems.map((item) => (
                      <OperatorNavItem key={item.to} {...item} />
                    ))}
                  </nav>
                </div>
              ) : null}

              <nav className="space-y-1" aria-label="Tools">
                {primaryToolItems.map((item) => (
                  <DrawerNavItem key={item.to} {...item} />
                ))}
              </nav>

              {isSuperuser ? null : (
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
                    className="focus-ring mt-3 inline-flex min-h-[40px] w-full items-center justify-center rounded-xl bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-900"
                  >
                    {isPremium ? "Manage plan" : "Upgrade to Pro"}
                  </Link>
                </div>
              )}

              {isSuperuserLoading && isSignedIn && !isSuperuser ? (
                <p className="mt-4 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-500">
                  Checking operator access...
                </p>
              ) : null}

              <nav className="mt-4 space-y-1" aria-label="More tools">
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">More tools</p>
                {moreToolItems.map((item) => (
                  <DrawerNavItem key={item.to} {...item} />
                ))}
              </nav>
            </div>

            <div className="shrink-0 border-t border-stone-200 bg-white/70 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
              <nav className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs" aria-label="Legal">
                <Link to="/disclaimer" className="font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-brand-800">
                  Disclaimer
                </Link>
                <Link
                  to="/disclaimer#content-removal"
                  className="font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-brand-800"
                >
                  IP &amp; Content Removal
                </Link>
                <Link to="/privacy" className="font-medium text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-brand-800">
                  Privacy
                </Link>
              </nav>
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
