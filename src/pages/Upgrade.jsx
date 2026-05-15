import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const premiumIdeas = [
  "Deadline alerts for saved universities and programmes",
  "Deeper shortlist tracking across devices",
  "Richer predictor history and admission guidance",
  "Priority support when checking application paths",
];

export default function Upgrade() {
  useDocumentTitle("Upgrade | Thuto");
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-900 p-5 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Thuto Premium</p>
        <h1 className="mt-3 font-display text-3xl font-bold">A stronger planning layer</h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-50/90">
          Premium is planned as a way to make saved choices, alerts, and admissions guidance more personal.
        </p>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-brand-900">Planned benefits</h2>
        <ul className="mt-3 space-y-2">
          {premiumIdeas.map((idea) => (
            <li key={idea} className="flex gap-2 text-sm text-slate-700">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-hidden />
              <span>{idea}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Payments are not connected yet. This page is a product preview.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {user ? (
          <Link
            to="/profile"
            className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            View profile
          </Link>
        ) : (
          <Link
            to="/auth?mode=signup"
            className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            Create account
          </Link>
        )}
        <Link
          to="/support"
          className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          Share premium ideas
        </Link>
      </div>
    </div>
  );
}
