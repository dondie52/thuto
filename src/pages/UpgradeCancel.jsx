import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function UpgradeCancel() {
  useDocumentTitle("Checkout canceled | Thuto");

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-brand-900">Checkout canceled</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          No charge was made. You can return to plans anytime.
        </p>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/upgrade"
          className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          View plans
        </Link>
        <Link
          to="/app"
          className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
