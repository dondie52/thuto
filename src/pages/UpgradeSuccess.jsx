import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { syncFromCloud } from "../lib/cloudSync.js";

export default function UpgradeSuccess() {
  useDocumentTitle("Pro activated | Thuto");
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { refreshProfile, profile } = useAuth();

  useEffect(() => {
    refreshProfile().then((p) => {
      if (p) syncFromCloud(p);
    });
  }, [refreshProfile]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-emerald-950">Welcome to Thuto Pro</h1>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
          {sessionId
            ? "Your payment was received. Pro may take a minute to activate while we confirm with Stripe."
            : "Thank you. If you just completed checkout, Pro will activate shortly."}
        </p>
        <p className="mt-2 text-sm text-emerald-800">
          Refresh your profile if benefits do not appear right away.
        </p>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/app"
          className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          Back to home
        </Link>
        <Link
          to="/profile"
          className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          View profile
        </Link>
        <button
          type="button"
          onClick={() => refreshProfile().then((p) => p && syncFromCloud(p))}
          className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          Refresh status
        </button>
      </div>
    </div>
  );
}
