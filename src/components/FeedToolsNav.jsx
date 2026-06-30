import { NavLink } from "react-router-dom";
import { feedToolsNavLinks } from "../lib/toolNavLinks.js";

function linkClass({ isActive }) {
  return [
    "focus-ring shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
    isActive ? "bg-brand-700 text-white" : "bg-white text-brand-800 shadow-sm hover:bg-brand-50",
  ].join(" ");
}

export default function FeedToolsNav() {
  return (
    <nav
      className="feed-tools-nav border-b border-brand-100/80 bg-[var(--thuto-surface-elevated)]/95 px-4 py-2 backdrop-blur-md"
      aria-label="Thuto tools"
    >
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {feedToolsNavLinks.map(({ to, label }) => (
          <NavLink key={to} to={to} className={linkClass}>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
