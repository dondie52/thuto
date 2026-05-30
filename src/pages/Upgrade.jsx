import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { startPremiumCheckout, isBillingConfigured } from "../lib/billing.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatPremiumUntil, getPlanCheckoutLabel, PREMIUM_PLANS } from "../lib/premium.js";

const iconClass = "h-5 w-5 shrink-0 text-brand-600";

const proFeatures = [
  {
    key: "alerts",
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
    ),
    text: "Deadline alerts for saved universities and programmes",
  },
  {
    key: "predictor",
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
    ),
    text: "Richer predictor history and admission guidance",
  },
  {
    key: "support",
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    ),
    text: "Priority support when checking applications",
  },
  {
    key: "pdf",
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
    text: (
      <>
        <strong className="font-semibold text-slate-800">Download &amp; Share:</strong> Get full programme breakdowns as
        PDFs to send to parents and teachers
      </>
    ),
  },
  {
    key: "whatsapp",
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a48.109 48.109 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.02-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        />
      </svg>
    ),
    text: (
      <>
        <strong className="font-semibold text-slate-800">WhatsApp Support:</strong> Message our team directly for help
        with results, deadlines, and applications
      </>
    ),
  },
  {
    key: "unlimited",
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
    ),
    text: (
      <>
        <strong className="font-semibold text-slate-800">Unlimited Tools:</strong> Unlimited AI messages, saves, and
        comparisons
      </>
    ),
  },
];

export default function Upgrade() {
  useDocumentTitle("Upgrade to Pro | Thuto");
  const navigate = useNavigate();
  const { user, isPremium, profile, supabaseConfigured } = useAuth();
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
  const showCheckout = !isPremium;

  return (
    <>
      <div className={`space-y-5 ${showCheckout ? "pb-28" : ""}`}>
        <section className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-900 p-5 text-white shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Thuto Pro</p>
          <h1 className="mt-3 font-display text-3xl font-bold">Get Pro. Plan with confidence</h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-50/90">
            Download programme breakdowns, get WhatsApp support, and unlock unlimited tools to finalize your
            applications
          </p>
        </section>

        {isPremium ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <p className="text-sm font-semibold text-emerald-900">You have Thuto Pro</p>
            {premiumUntil ? (
              <p className="mt-1 text-sm text-emerald-800">Active until {premiumUntil}.</p>
            ) : (
              <p className="mt-1 text-sm text-emerald-800">Your Pro benefits are active.</p>
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
          <h2 className="font-display text-xl font-semibold text-brand-900">Pro Features</h2>
          <ul className="mt-3 space-y-3">
            {proFeatures.map((feature) => (
              <li key={feature.key} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                <span className="mt-0.5">{feature.icon}</span>
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {showCheckout ? (
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
                  className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${
                    plan.highlighted ? "border-brand-500 ring-2 ring-brand-200" : "border-brand-100"
                  }`}
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
                    className={`focus-ring mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60 ${
                      plan.highlighted
                        ? "bg-brand-700 text-white hover:bg-brand-800"
                        : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                    }`}
                  >
                    {loadingPlan === plan.id ? "Starting checkout..." : getPlanCheckoutLabel(plan.id)}
                  </button>
                </article>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              University application and tuition fees are not processed by Thuto. Pro is billed via Stripe for Thuto
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
            Share Pro ideas
          </Link>
        </div>
      </div>

      {showCheckout ? (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-brand-100 bg-white/95 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            disabled={loadingPlan != null}
            onClick={() => handleCheckout("season_pass")}
            className="focus-ring w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
          >
            {loadingPlan === "season_pass" ? "Starting checkout..." : "Upgrade to Pro – P59"}
          </button>
        </div>
      ) : null}
    </>
  );
}
