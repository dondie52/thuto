import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function NotFound() {
  useDocumentTitle("Page not found | Thuto");

  return (
    <div className="space-y-6 text-center sm:text-left">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">404</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-brand-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          That link does not match any page in Thuto. Check the URL or head back to the app home.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
        <Link
          to="/app"
          className="focus-ring inline-flex rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          App home
        </Link>
        <Link to="/" className="focus-ring text-sm font-semibold text-brand-800 underline hover:text-brand-950">
          Marketing site
        </Link>
        <Link to="/programmes" className="focus-ring text-sm font-semibold text-brand-800 underline hover:text-brand-950">
          Programmes
        </Link>
      </div>
    </div>
  );
}
