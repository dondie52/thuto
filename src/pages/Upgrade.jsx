import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { startPremiumCheckout, isBillingConfigured } from "../lib/billing.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatPremiumUntil, PREMIUM_PLANS } from "../lib/premium.js";

const premiumIdeas = [
  "Deadline alerts for saved universities and programmes",
  "Deeper shortlist tracking across devices",
  "Richer predictor history and admission guidance",
  "Priority support when checking application paths",
];

export default function Upgrade() {
  useDocumentTitle("Upgrade | Thuto");
  const navigate = useNavigate();
  const { user, isPremium, profile, refreshProfile, supabaseConfigured } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");

  async function handleCheckout(planId) {
    setError("");
    if (!user) {
      navigate(`/auth?mode=login&next=${encodeURIComponent("/upgrade")}`);
      return;
    }
    if (!isBillingConfigured()) {
      setError("Billing is not configured yet. Add Supabase and Stripe secrets to enable checkout.");
      return;
    }
    setLoadingPlan(planId);
    try {
      const url = await startPremiumCheckout(planId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setLoadingPlan(null);
    }
  }

  const premiumUntil = formatPremiumUntil(profile);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-900 p-5 text-white shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Thuto Premium</p>
        <h1 className="mt-3 font-display text-3xl font-bold">A stronger planning layer</h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-50/90">
          Make saved choices, alerts, and admissions guidance more personal — with cloud backup when you sign in.
        </p>
      </section>

      {isPremium ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-emerald-900">You have Thuto Premium</p>
          {premiumUntil ? (
            <p className="mt-1 text-sm text-emerald-800">Active until {premiumUntil}.</p>
          ) : (
            <p className="mt-1 text-sm text-emerald-800">Your premium benefits are active.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/profile"
              className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
            >
              View profile
            </Link>
            {profile?.stripe_customer_id ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { openBillingPortal } = await import("../lib/billing.js");
                    const url = await openBillingPortal();
                    window.location.href = url;
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Could not open billing portal.");
                  }
                }}
                className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
              >
                Manage billing
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

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
      </section>

      {!isPremium ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-brand-900">Choose a plan</h2>
          {!supabaseConfigured ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Sign-in and billing require Supabase to be configured for this deployment.
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            {PREMIUM_PLANS.map((plan) => (
              <article
                key={plan.id}
                className="flex flex-col rounded-2xl border border-brand-100 bg-white p-4 shadow-sm"
              >
                {plan.badge ? (
                  <span className="mb-2 w-fit rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                    {plan.badge}
                  </span>
                ) : null}
                <h3 className="font-display text-lg font-semibold text-brand-900">{plan.name}</h3>
                <p className="mt-1 text-sm font-semibold text-brand-700">{plan.priceLabel}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{plan.description}</p>
                <button
                  type="button"
                  disabled={loadingPlan != null}
                  onClick={() => handleCheckout(plan.id)}
                  className="focus-ring mt-4 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
                >
                  {loadingPlan === plan.id ? "Starting checkout..." : "Start Premium"}
                </button>
              </article>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            University application and tuition fees are not processed by Thuto. Premium is billed via Stripe for Thuto
            features only.
          </p>
        </section>
      ) : null}

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
            to="/auth?mode=signup&next=/upgrade"
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
