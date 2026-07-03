import { Link } from "react-router-dom";
import { isSupabaseConfigured } from "../lib/communitySubmissions.js";

/**
 * Programme match list for the admission predictor (status badges + reasons).
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
    <section ref={sectionRef} id="predictor-results-section" className="space-y-4" aria-live="polite">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="font-display text-lg font-semibold text-brand-900">Step 2: Review your programme matches</h2>
          <p className="text-sm leading-relaxed text-stone-600">
            Qualified: <strong className="text-brand-900">{summary.Qualified}</strong> · Close:{" "}
            <strong className="text-brand-900">{summary.Close}</strong> · Not eligible:{" "}
            <strong className="text-brand-900">{summary["Not eligible"]}</strong> · Unverified:{" "}
            <strong className="text-brand-900">{summary.Unknown ?? 0}</strong>
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Link
            to="/programmes?qualify=1"
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
          >
            Browse within points
          </Link>
          <button
            type="button"
            onClick={onShare}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-[var(--thuto-surface-elevated)] px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Share results
          </button>
          <button
            type="button"
            onClick={onEditGrades}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-[var(--thuto-surface-elevated)] px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Try different grades
          </button>
        </div>
      </div>

      {shareFeedback ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {shareFeedback}
        </p>
      ) : null}

      {communityEnabled ? (
        <p className="text-sm text-stone-600">
          Already applied?{" "}
          <Link to="/share" className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-900">
            Share your outcome anonymously
          </Link>{" "}
          and help future students.
        </p>
      ) : null}

      <p className="text-sm leading-relaxed text-stone-600">
        These matches are for planning, not a final admission decision. Open any promising programme and confirm the
        latest requirements on the institution&apos;s official site.
      </p>

      <div className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">Next small step</p>
        <p className="mt-1 text-sm leading-relaxed text-brand-950">
          Pick one programme that looks realistic, open its details, then save it or compare it with another option.
        </p>
      </div>

      <ul className="divide-y divide-brand-100 overflow-hidden rounded-2xl border border-brand-200 bg-[var(--thuto-surface-elevated)] shadow-card">
        {results.map(({ programme, status, reason, total }) => {
          const statusLabel = status === "Unknown" ? "Unverified" : status;
          return (
            <li key={programme.id} className="px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold text-brand-900">{programme.name}</p>
                  <p className="mt-0.5 text-sm text-stone-600">{programme.university}</p>
                  <p className="mt-2 text-sm text-stone-600">
                    Your best-six total vs this programme: <strong className="text-brand-900">{total}</strong>
                    {typeof programme.minPoints === "number" && Number.isFinite(programme.minPoints) ? (
                      <> / {programme.minPoints} min pts</>
                    ) : (
                      <> · min pts not listed in Thuto</>
                    )}
                  </p>
                  {reason ? <p className="mt-2 text-sm leading-relaxed text-stone-600">{reason}</p> : null}
                </div>
                <span
                  className={[
                    "inline-flex shrink-0 self-start rounded-full px-3 py-1 text-xs font-semibold",
                    status === "Qualified" && "bg-emerald-100 text-emerald-900",
                    status === "Close" && "bg-amber-100 text-amber-950",
                    status === "Not eligible" && "bg-stone-100 text-stone-800",
                    status === "Unknown" && "border border-stone-200 bg-stone-50 text-stone-700",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link
                  to={`/programmes/${programme.id}`}
                  className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-900"
                >
                  Open programme details
                </Link>
                {communityEnabled ? (
                  <Link
                    to={`/share?programme=${encodeURIComponent(programme.id)}`}
                    className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:text-brand-900"
                  >
                    Share if you applied
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
