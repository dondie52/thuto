import { NavLink } from "react-router-dom";
import ToolIcon from "./ToolIcon.jsx";
import { drawerPrimaryToolItems } from "../lib/toolNavLinks.js";

/**
 * Persistent desktop navigation rail (lg and up). On smaller screens the header's inline nav
 * and the mobile bottom bar keep their existing behaviour, so nothing here is rendered.
 *
 * Link sources are the shared constants rather than a new list, so the rail cannot drift from
 * the account drawer and the header nav.
 */
const MAIN_LINKS = [
  { to: "/app", label: "Home", icon: "home", end: true },
  { to: "/predictor", label: "Predictor", icon: "predictor" },
  { to: "/feed", label: "Feed", icon: "feed" },
  { to: "/assistant", label: "Ask Thuto", icon: "assistant" },
];

// drawerPrimaryToolItems = primaryToolNavLinks (Programmes, Institutions, Sponsorships, Centre,
// Postgraduate) followed by My Applications, Saved, Compare.
const EXPLORE_LINKS = drawerPrimaryToolItems.slice(0, 5);
const YOURS_LINKS = drawerPrimaryToolItems.slice(5);

function linkClass({ isActive }) {
  return [
    "focus-ring flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-200",
    isActive ? "bg-brand-700 text-white shadow-sm" : "text-stone-600 hover:bg-white hover:text-brand-900",
  ].join(" ");
}

function NavGroup({ title, links }) {
  return (
    <div>
      <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">{title}</p>
      <ul className="space-y-0.5">
        {links.map(({ to, label, icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={linkClass} title={label}>
              <ToolIcon name={icon} className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * @param {{ top: number }} props - distance from the viewport top, matching the fixed header height.
 */
export default function DesktopSideNav({ top = 0 }) {
  return (
    <nav
      aria-label="Primary sidebar"
      style={{ top }}
      className="fixed bottom-0 left-0 z-20 hidden w-60 overflow-y-auto border-r border-stone-200/80 bg-[var(--thuto-surface-elevated)]/95 px-3 py-5 backdrop-blur-md lg:block"
    >
      <div className="space-y-5">
        <NavGroup title="Main" links={MAIN_LINKS} />
        <NavGroup title="Explore" links={EXPLORE_LINKS} />
        <NavGroup title="Yours" links={YOURS_LINKS} />
      </div>
    </nav>
  );
}
