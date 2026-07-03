import { Link } from "react-router-dom";
import { isSupabaseConfigured } from "../lib/communitySubmissions.js";

/**
 * Programme match list for the admission predictor (status badges + reasons).
 * @param {{
 *   results: Array<{ programme: { id: string, name: string, university: string, minPoints: number | null }, status: string, reason: string | null, total: number }>,
 *   summary: { Qualified: number, Close: number, 'Not eligible': number, Unknown: number },
 *   onEditGrades: () => void,
 *   onShare: () => void,
 *   shareFeedback: string | null,
 *   sectionRef: React.RefObject<HTMLElement | null>,
 * }} props
 */
export default function ProgrammePredictorResults({
  results,
  summary,
  onEditGrades,
  onShare,
  shareFeedback,
  sectionRef,
}) {
  const communityEnabled = isSupabaseConfigured();

  return (
    <section ref={sectionRef} id="predictor-results-section" className="space-y-3" aria-live="polite">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-semibold text-brand-900">Step 2: Review your programme matches</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/programmes?qualify=1"
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Browse within points
          </Link>
          <button
            type="button"
            onClick={onShare}
            className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
          >
            Share results
          </button>
          <button
            type="button"
            onClick={onEditGrades}
            className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
          >
            Try different grades
          </button>
        </div>
      </div>
      {shareFeedback && (
        <p className="text-sm text-emerald-800" role="status">
          {shareFeedback}
        </p>
      )}
      {communityEnabled && (
        <p className="text-sm text-slate-600">
          Already applied?{" "}
          <Link to="/share" className="font-medium text-brand-700 underline hover:text-brand-900">
            Share your outcome anonymously
          </Link>{" "}
          and help future students.
        </p>
      )}
      <p className="text-sm leading-relaxed text-slate-600">
        These matches are for planning, not a final admission decision. Open any promising programme and confirm the
        latest requirements on the institution's official site.
      </p>
      <p className="text-sm text-slate-600">
        Qualified: <strong>{summary.Qualified}</strong> · Close: <strong>{summary.Close}</strong> · Not eligible:{" "}
        <strong>{summary["Not eligible"]}</strong> · Unverified: <strong>{summary.Unknown ?? 0}</strong>
      </p>
      <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Next small step</p>
        <p className="mt-1 text-sm leading-relaxed text-brand-950">
          Pick one programme that looks realistic, open its details, then save it or compare it with another option.
        </p>
      </div>
      <ul className="divide-y divide-brand-100 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm">
        {results.map(({ programme, status, reason, total }) => (
          <li key={programme.id} className="px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-medium text-brand-900">{programme.name}</p>
                <p className="text-xs text-slate-500">{programme.university}</p>
              </div>
              <span
                className={[
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  status === "Qualified" && "bg-emerald-100 text-emerald-800",
                  status === "Close" && "bg-amber-100 text-amber-900",
                  status === "Not eligible" && "bg-slate-100 text-slate-700",
                  status === "Unknown" && "border border-slate-200 bg-slate-50 text-slate-600",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {status === "Unknown" ? "Unverified" : status}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Your best-six total vs this programme: <strong>{total}</strong>
              {typeof programme.minPoints === "number" && Number.isFinite(programme.minPoints) ? (
                <> / {programme.minPoints} min pts</>
              ) : (
                <> · min pts not listed in Thuto</>
              )}
            </p>
            {reason && <p className="mt-2 text-sm text-slate-600">{reason}</p>}
            <p className="mt-2">
              <Link
                to={`/programmes/${programme.id}`}
                className="text-xs font-medium text-brand-700 underline hover:text-brand-900"
              >
                Open programme details
              </Link>
            </p>
            {communityEnabled && (
              <p className="mt-2">
                <Link
                  to={`/share?programme=${encodeURIComponent(programme.id)}`}
                  className="text-xs font-medium text-brand-700 underline hover:text-brand-900"
                >
                  Share if you applied for this programme
                </Link>
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
