import { NavLink } from "react-router-dom";

const links = [
  {
    to: "/app",
    label: "Home",
    end: true,
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: "/center",
    label: "Library",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    to: "/predictor",
    label: "Predictor",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16l4-4 4 4 6-6" />
      </svg>
    ),
  },
  {
    to: "/feed",
    label: "Feed",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 7-7 11-7-11 7-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 10l2.5-2.5L14.5 10 12 13.5 9.5 10z" />
      </svg>
    ),
  },
  {
    to: "/assistant",
    label: "Ask",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A3.5 3.5 0 017.5 2h9A3.5 3.5 0 0120 5.5v6A3.5 3.5 0 0116.5 15H10l-4.5 4v-4A3.5 3.5 0 014 11.5v-6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6M9 10.5h4" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 21a7.5 7.5 0 0115 0" />
      </svg>
    ),
  },
];

function linkClass({ isActive }) {
  return [
    "focus-ring flex min-h-[44px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[9px] font-semibold leading-none transition-all duration-200",
    isActive ? "bg-brand-700 text-white shadow-sm" : "text-stone-500 hover:bg-stone-100 hover:text-brand-800",
  ].join(" ");
}

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-stone-200/90 bg-[var(--thuto-surface-elevated)]/95 shadow-nav backdrop-blur-md">
        <div className="grid grid-cols-5 gap-0.5 px-1 py-1">
          {links.map(({ to, label, end, icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass} title={to === "/center" ? "Thuto Center" : undefined}>
              {icon}
              <span className="max-w-full truncate whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
