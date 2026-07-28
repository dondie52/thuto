import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { buildCmsUrl } from "../lib/cmsUrl.js";

export default function PartnerRedirect() {
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
          Institution staff use the standalone dashboard, so Thuto is redirecting you to the separate CMS frontend now.
        </p>
      </div>
    </div>
  );
}
