import { useEffect } from "react";
import { Link } from "react-router-dom";
import ProfileEditForm from "../components/ProfileEditForm.jsx";
import { PREDICTOR_BEST_SIX_STORAGE_KEY, PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY } from "../lib/admissions.js";
import { getBookmarkIds } from "../lib/bookmarks.js";
import { useAuth } from "../lib/auth.jsx";
import { syncFromCloud } from "../lib/cloudSync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatAuthorUniversity } from "../lib/profile.js";
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
  const { supabaseConfigured, user, profile, isPremium, refreshProfile, saveProfile, isProfileLoading } = useAuth();
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

      {isSignedIn && supabaseConfigured ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Public profile</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-brand-900">How you appear on the feed</h2>
              <p className="mt-1 text-sm text-slate-600">
                Add a photo, your university, and a short distinction so other students recognise you.
              </p>
            </div>
            <Link
              to="/feed"
              className="rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
            >
              Open feed
            </Link>
          </div>
          {profile?.avatar_url || profile?.university_name || profile?.distinction ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-brand-50/80 px-3 py-3 text-sm text-brand-900">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                />
              ) : null}
              <div className="min-w-0">
                <p className="font-semibold">{profile.full_name || user.email}</p>
                {formatAuthorUniversity({
                  universityName: profile.university_name,
                  universityStatus: profile.university_status,
                }) ? (
                  <p className="text-xs text-brand-800/90">
                    {formatAuthorUniversity({
                      universityName: profile.university_name,
                      universityStatus: profile.university_status,
                    })}
                  </p>
                ) : null}
                {profile.distinction ? (
                  <p className="text-xs text-stone-600">{profile.distinction}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="mt-4">
            <ProfileEditForm
              profile={profile}
              onSave={saveProfile}
              disabled={isProfileLoading}
            />
          </div>
        </section>
      ) : null}

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
