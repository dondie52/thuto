import { NavLink } from "react-router-dom";

const links = [
  {
    to: "/app",
    label: "Home",
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
    to: "/saved",
    label: "Saved",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
      </svg>
    ),
  },
  {
    to: "/assistant",
    label: "Ask",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A3.5 3.5 0 017.5 2h9A3.5 3.5 0 0120 5.5v6A3.5 3.5 0 0116.5 15H10l-4.5 4v-4A3.5 3.5 0 014 11.5v-6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6M9 10.5h4" />
      </svg>
    ),
  },
];

function linkClass({ isActive }) {
  return [
    "focus-ring flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold leading-none transition-all duration-200",
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
        <div className="grid grid-cols-5 gap-1 px-1.5 py-1.5">
          {links.map(({ to, label, end, icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {icon}
              <span className="max-w-full truncate whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
