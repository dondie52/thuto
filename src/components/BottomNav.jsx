import { NavLink } from "react-router-dom";

const links = [
  {
    to: "/app",
    label: "App",
    end: true,
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: "/predictor",
    label: "Predictor",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16l4-4 4 4 6-6" />
      </svg>
    ),
  },
  {
    to: "/programmes",
    label: "Programmes",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    to: "/compare",
    label: "Compare",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H5v14h4V5zm10 0h-4v14h4V5z" />
      </svg>
    ),
  },
  {
    to: "/saved",
    label: "Saved",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
      </svg>
    ),
  },
  {
    to: "/universities",
    label: "Univ.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v0M9 12v0M9 15v0M9 18v0" />
      </svg>
    ),
  },
];

function linkClass({ isActive }) {
  return [
    "focus-ring flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-2 text-[10px] font-semibold uppercase tracking-wide transition-all duration-200",
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
        <div className="flex justify-around gap-0.5 px-1 py-1.5">
          {links.map(({ to, label, end, icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {icon}
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
