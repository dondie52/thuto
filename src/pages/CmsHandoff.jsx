import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { buildCmsUrl } from "../lib/cmsUrl.js";

/**
 * Hard handoff into the standalone Institution Dashboard frontend.
 * Used when the student SPA still receives /partner or /cms navigations
 * (for example from a cached service worker before denylist updates).
 */
export default function CmsHandoff() {
  const location = useLocation();

  useEffect(() => {
    const nextPath = `${location.pathname}${location.search}${location.hash}`;
    window.location.replace(buildCmsUrl(nextPath));
  }, [location.hash, location.pathname, location.search]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md rounded-3xl border border-brand-200 bg-white p-6 text-center shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Institution Dashboard</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-brand-900">Opening the CMS</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Institution staff use the standalone dashboard. Thuto is redirecting you out of the student app now.
        </p>
        <a
          href={buildCmsUrl(location.pathname)}
          className="mt-5 inline-flex rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Continue to CMS
        </a>
      </div>
    </div>
  );
}
