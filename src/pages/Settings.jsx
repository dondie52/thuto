import { useState } from "react";
import { Link } from "react-router-dom";
import { PREDICTOR_BEST_SIX_STORAGE_KEY, PREDICTOR_REQUIREMENT_GRADES_STORAGE_KEY } from "../lib/admissions.js";
import { STORAGE_KEY as BOOKMARK_STORAGE_KEY } from "../lib/bookmarks.js";
import { useAuth } from "../lib/auth.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Settings() {
  useDocumentTitle("General Settings | Thuto");
  const { supabaseConfigured, user } = useAuth();
  const [notice, setNotice] = useState("");

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

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Settings</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">General settings</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Manage your account, local data, and app preferences for this device.
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
        ) : null}
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-brand-900">Local data</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Predictor summaries and saved programmes are stored locally in this version.
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
