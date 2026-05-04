import { useEffect, useMemo, useState } from "react";
import {
  getSubmissionRateLimitState,
  insertSubmission,
  isSupabaseConfigured,
} from "../lib/communitySubmissions.js";

const MIN_YEAR = 2018;
const MAX_YEAR = 2030;

/**
 * @param {{
 *   programmes: Array<{ id: string, name: string, university: string }>,
 *   initialProgrammeId?: string,
 * }} props
 */
export default function ShareAdmissionResultForm({ programmes, initialProgrammeId = "" }) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(/** @type {{ id: string, name: string, university: string } | null} */ (null));
  const [points, setPoints] = useState("");
  const [outcome, setOutcome] = useState(/** @type {'accepted' | 'waitlisted' | 'rejected' | null} */ (null));
  const currentCalendarYear = new Date().getFullYear();
  const maxSelectableYear = Math.min(MAX_YEAR, currentCalendarYear);

  const [year, setYear] = useState(() => Math.min(maxSelectableYear, Math.max(MIN_YEAR, currentCalendarYear)));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(/** @type {string | null} */ (null));
  const [doneMessage, setDoneMessage] = useState(/** @type {string | null} */ (null));

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!initialProgrammeId || !programmes.length) return;
    const found = programmes.find((p) => p.id === initialProgrammeId);
    if (found) setSelected(found);
  }, [initialProgrammeId, programmes]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return programmes.slice(0, 40);
    return programmes
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.university.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [programmes, filter]);

  const limit = getSubmissionRateLimitState();

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setDoneMessage(null);

    if (!configured) {
      setFormError("Submissions are not enabled on this deployment.");
      return;
    }
    if (!selected) {
      setFormError("Choose a programme from the list.");
      return;
    }
    if (!outcome) {
      setFormError("Select an outcome (accepted, waitlisted, or rejected).");
      return;
    }
    const pts = Number(points);
    if (!Number.isFinite(pts) || pts < 0 || pts > 54) {
      setFormError("Enter your best-six points total between 0 and 54.");
      return;
    }
    if (year < MIN_YEAR || year > maxSelectableYear) {
      setFormError("Choose a valid application year.");
      return;
    }

    setSubmitting(true);
    try {
      await insertSubmission({
        programmeId: selected.id,
        programmeName: selected.name,
        university: selected.university,
        points: pts,
        outcome,
        year,
      });
      setDoneMessage("Thank you - your result will appear after a quick review.");
      setPoints("");
      setOutcome(null);
    } catch (err) {
      setFormError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Community submissions are not configured (missing Supabase environment variables).
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="share-programme-search" className="block text-sm font-medium text-brand-900">
          Programme applied for
        </label>
        {selected ? (
          <div className="mt-2 rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2">
            <p className="text-sm font-medium text-brand-900">{selected.name}</p>
            <p className="text-xs text-slate-600">{selected.university}</p>
            <button
              type="button"
              className="mt-2 text-xs font-medium text-brand-700 underline"
              onClick={() => {
                setSelected(null);
                setFilter("");
              }}
            >
              Change programme
            </button>
          </div>
        ) : (
          <>
            <input
              id="share-programme-search"
              type="search"
              autoComplete="off"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by programme or university…"
              className="mt-2 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <ul
              className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-brand-100 bg-white text-sm shadow-sm"
              role="listbox"
              aria-label="Matching programmes"
            >
              {filtered.length === 0 && <li className="px-3 py-2 text-slate-500">No matches.</li>}
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    className="w-full px-3 py-2 text-left hover:bg-brand-50"
                    onClick={() => {
                      setSelected(p);
                      setFilter("");
                    }}
                  >
                    <span className="font-medium text-brand-900">{p.name}</span>
                    <span className="block text-xs text-slate-500">{p.university}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div>
        <label htmlFor="share-points" className="block text-sm font-medium text-brand-900">
          Your best-six points total
        </label>
        <input
          id="share-points"
          type="number"
          inputMode="numeric"
          min={0}
          max={54}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="mt-2 w-full max-w-xs rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-slate-500">0–54 (same scale as the predictor).</p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-brand-900">Outcome</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { id: "accepted", label: "Accepted" },
            { id: "waitlisted", label: "Waitlisted" },
            { id: "rejected", label: "Rejected" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setOutcome(/** @type {'accepted' | 'waitlisted' | 'rejected'} */ (id))}
              className={[
                "rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
                outcome === id
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-brand-200 bg-white text-brand-800 hover:bg-brand-50",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="share-year" className="block text-sm font-medium text-brand-900">
          Year of application
        </label>
        <select
          id="share-year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="mt-2 w-full max-w-xs rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {Array.from({ length: maxSelectableYear - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-500">
        No account required. You can submit up to 3 times per day on this device ({limit.remainingToday} left today).
      </p>

      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {formError}
        </p>
      )}
      {doneMessage && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {doneMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !limit.allowed}
        className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Submit anonymously"}
      </button>
    </form>
  );
}
