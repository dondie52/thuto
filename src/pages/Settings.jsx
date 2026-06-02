import { useState } from "react";
import { Link } from "react-router-dom";
import { PREDICTOR_BEST_SIX_STORAGE_KEY, PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY } from "../lib/admissions.js";
import { STORAGE_KEY as BOOKMARK_STORAGE_KEY } from "../lib/bookmarks.js";
import { openBillingPortal } from "../lib/billing.js";
import { syncToCloud } from "../lib/cloudSync.js";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatPremiumUntil } from "../lib/premium.js";

export default function Settings() {
  useDocumentTitle("General Settings | Thuto");
  const { supabaseConfigured, user, profile, isPremium, isSuperuser } = useAuth();
  const [notice, setNotice] = useState("");
  const [billingLoading, setBillingLoading] = useState(false);

  function clearPredictor() {
    try {
      sessionStorage.removeItem(PREDICTOR_BEST_SIX_STORAGE_KEY);
      sessionStorage.removeItem(PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY);
      setNotice("Predictor summary cleared from this session.");
    } catch {
      setNotice("Could not clear predictor summary.");
    }
  }

  function clearSavedProgrammes() {
    try {
      localStorage.removeItem(BOOKMARK_STORAGE_KEY);
      setNotice("Saved programmes cleared from this device.");
    } catch {
      setNotice("Could not clear saved programmes.");
    }
  }

  async function handleManageBilling() {
    setBillingLoading(true);
    setNotice("");
    try {
      const url = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not open billing portal.");
      setBillingLoading(false);
    }
  }

  async function handleSyncNow() {
    if (!profile || !isPremium) return;
    setNotice("");
    try {
      await syncToCloud(profile);
      setNotice("Shortlist and predictor snapshot pushed to your account.");
    } catch {
      setNotice("Cloud sync failed. Try again shortly.");
    }
  }

  const premiumUntil = formatPremiumUntil(profile);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Settings</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">General settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Manage your account, billing, local data, and app preferences for this device.
        </p>
      </div>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-brand-900">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-semibold text-brand-900">{user ? "Signed in" : "Not signed in"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Email</dt>
            <dd className="max-w-[12rem] truncate font-semibold text-brand-900">{user?.email || "Not signed in"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Plan</dt>
            <dd className="font-semibold text-brand-900">{isPremium ? "Pro" : "Free"}</dd>
          </div>
          {isPremium && premiumUntil ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Renews / ends</dt>
              <dd className="font-semibold text-brand-900">{premiumUntil}</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Supabase auth</dt>
            <dd className="font-semibold text-brand-900">{supabaseConfigured ? "Configured" : "Unavailable"}</dd>
          </div>
        </dl>
        {!user ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/auth?mode=signup"
              className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
            >
              Sign up
            </Link>
            <Link
              to="/auth?mode=login"
              className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              Log in
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {isPremium && profile?.stripe_customer_id ? (
              <button
                type="button"
                disabled={billingLoading}
                onClick={handleManageBilling}
                className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:opacity-60"
              >
                {billingLoading ? "Opening portal..." : "Manage subscription"}
              </button>
            ) : (
              <Link
                to="/upgrade"
                className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
              >
                Upgrade to Pro
              </Link>
            )}
          </div>
        )}
      </section>

      {isSuperuser ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-brand-900">Superuser tools</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Open the operations control room or jump straight into feed moderation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/admin"
              className="inline-flex rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
            >
              Open control room
            </Link>
            <Link
              to="/admin/feed"
              className="inline-flex rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              Open feed moderation
            </Link>
          </div>
        </section>
      ) : null}

      {isPremium && user ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-emerald-950">Cloud backup</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-900">
            Pro keeps your saved programmes and predictor snapshot in your account. Data still loads locally first for
            speed.
          </p>
          <button
            type="button"
            onClick={handleSyncNow}
            className="focus-ring mt-4 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
          >
            Sync now
          </button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-brand-900">Local data</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Predictor summaries and saved programmes are stored on this device. Pro can mirror them to your account.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={clearPredictor}
            className="focus-ring rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Clear predictor summary
          </button>
          <button
            type="button"
            onClick={clearSavedProgrammes}
            className="focus-ring rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Clear saved programmes
          </button>
        </div>
        {notice ? <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">{notice}</p> : null}
      </section>
    </div>
  );
}
