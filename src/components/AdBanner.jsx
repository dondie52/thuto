import { Link } from "react-router-dom";

/**
 * House ad slot for free tier — promotes Thuto Pro.
 */
export default function AdBanner() {
  return (
    <aside
      className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-brand-50 px-4 py-3 text-sm shadow-sm"
      aria-label="Sponsored"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">Sponsored</p>
      <p className="mt-1 font-medium text-brand-900">Application season? Go Pro once — P59/year.</p>
      <p className="mt-0.5 text-xs text-slate-600">Unlimited saves, acceptance chances, alerts, and no ads.</p>
      <Link
        to="/upgrade"
        className="mt-2 inline-flex rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
      >
        Upgrade to Pro
      </Link>
    </aside>
  );
}
