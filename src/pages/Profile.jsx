import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PREDICTOR_BEST_SIX_STORAGE_KEY, PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY } from "../lib/admissions.js";
import { getBookmarkIds } from "../lib/bookmarks.js";
import { useAuth } from "../lib/auth.jsx";
import { syncFromCloud } from "../lib/cloudSync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatPremiumUntil } from "../lib/premium.js";

function readPredictorSummary() {
  try {
    const total = sessionStorage.getItem(PREDICTOR_BEST_SIX_STORAGE_KEY);
    const grades = sessionStorage.getItem(PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY);
    const parsedGrades = grades ? JSON.parse(grades) : null;
    return {
      total: total == null ? null : Number(total),
      requirementCount: parsedGrades && typeof parsedGrades === "object" ? Object.keys(parsedGrades).length : 0,
    };
  } catch {
    return { total: null, requirementCount: 0 };
  }
}

export default function Profile() {
  useDocumentTitle("Profile | Thuto");
  const { supabaseConfigured, user, profile, isPremium, refreshProfile } = useAuth();
  const savedCount = getBookmarkIds().length;
  const predictor = readPredictorSummary();
  const isSignedIn = Boolean(user);
  const premiumUntil = formatPremiumUntil(profile);

  useEffect(() => {
    if (profile && isPremium) {
      syncFromCloud(profile);
    }
  }, [profile, isPremium]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Profile</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">
          {isSignedIn ? "Your Thuto account" : "Your profile"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {isSignedIn
            ? isPremium
              ? "Pro is active. Your shortlist and predictor summary can sync across devices when you use saved programmes."
              : "Your account is active. Local predictor and shortlist data stay on this device unless you upgrade to Pro."
            : "Sign in to save your pathway and sync your account across visits."}
        </p>
      </div>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account status</p>
        <p className="mt-2 font-display text-2xl font-semibold text-brand-900">
          {isSignedIn ? "Signed in" : "Not signed in"}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {isSignedIn ? user.email : supabaseConfigured ? "No account signed in." : "Account login is not configured yet."}
        </p>
        {!isSignedIn ? (
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
        ) : null}
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thuto plan</p>
        <p className="mt-2 font-display text-2xl font-semibold text-brand-900">
          {isPremium ? "Pro" : "Free"}
        </p>
        {isPremium && premiumUntil ? (
          <p className="mt-1 text-sm text-slate-600">Active until {premiumUntil}.</p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">
            Upgrade for cloud shortlist sync, deadline alerts on saved choices, and compare up to five programmes.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {isPremium ? (
            <Link
              to="/settings"
              className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              Manage billing
            </Link>
          ) : (
            <Link
              to="/upgrade"
              className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
            >
              Upgrade to Pro
            </Link>
          )}
          <button
            type="button"
            onClick={() => refreshProfile()}
            className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Refresh plan status
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Best six</p>
          <p className="mt-2 text-3xl font-bold text-brand-900">{predictor.total == null ? "--" : predictor.total}</p>
          <p className="mt-1 text-xs text-slate-600">Latest predictor total on this device.</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Subject keys</p>
          <p className="mt-2 text-3xl font-bold text-brand-900">{predictor.requirementCount}</p>
          <p className="mt-1 text-xs text-slate-600">Requirement categories saved from predictor rows.</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Saved</p>
          <p className="mt-2 text-3xl font-bold text-brand-900">{savedCount}</p>
          <p className="mt-1 text-xs text-slate-600">
            {isPremium ? "Shortlist synced to your account when you save programmes." : "Programmes shortlisted on this device."}
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/predictor"
          className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          Open predictor
        </Link>
        <Link
          to="/saved"
          className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          View saved programmes
        </Link>
      </div>
    </div>
  );
}
