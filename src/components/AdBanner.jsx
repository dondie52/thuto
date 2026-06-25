import { Link } from "react-router-dom";

/**
 * @param {{ className?: string }} [props]
 */
export default function AdBanner({ className = "" }) {
  return (
    <aside
      className={`rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm ${className}`}
      aria-label="Advertisement"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/80">Sponsored</p>
      <p className="mt-1 text-sm font-semibold text-amber-950">Plan applications with Thuto Pro</p>
      <p className="mt-0.5 text-xs leading-relaxed text-amber-900/90">
        No ads, unlimited AI, deadline alerts, and PDF downloads — from P59/year.
      </p>
      <Link
        to="/upgrade"
        className="focus-ring mt-2 inline-flex rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
      >
        Upgrade to Pro
      </Link>
    </aside>
  );
}
