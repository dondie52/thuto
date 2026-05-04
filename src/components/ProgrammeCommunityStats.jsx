import { Link } from "react-router-dom";
import { useProgrammeCommunityStats } from "../hooks/useProgrammeCommunityStats.js";

/**
 * @param {{ programmeId: string }} props
 */
export default function ProgrammeCommunityStats({ programmeId }) {
  const { disabled, loading, error, stats } = useProgrammeCommunityStats(programmeId);

  if (disabled) return null;

  const shareHref = `/share?programme=${encodeURIComponent(programmeId)}`;

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-brand-900">Community admission data</h2>
      <p className="mt-2 text-sm text-slate-600">
        Anonymous reports from students (verified before they appear). Helps everyone see real score patterns.
      </p>

      {loading && <p className="mt-4 text-sm text-slate-500">Loading community data…</p>}

      {error && (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && stats && stats.totalCount < 5 && (
        <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-5 text-center">
          <p className="text-sm text-slate-700">No community data yet for this programme (need a few verified reports).</p>
          <Link
            to={shareHref}
            className="mt-3 inline-block text-sm font-semibold text-brand-800 underline hover:text-brand-950"
          >
            Share your result
          </Link>
        </div>
      )}

      {!loading && !error && stats && stats.totalCount >= 5 && (
        <div className="mt-4 space-y-4">
          <p className="text-sm font-medium text-brand-900">Based on {stats.totalCount} student reports</p>

          <OutcomeRow label="Accepted" tone="emerald" data={stats.accepted} />
          <OutcomeRow label="Waitlisted" tone="amber" data={stats.waitlisted} />
          <OutcomeRow label="Rejected" tone="slate" data={stats.rejected} />

          {stats.latestYear != null && (
            <p className="text-xs text-slate-500">Most recent reports include intake up to {stats.latestYear}.</p>
          )}

          <Link to={shareHref} className="inline-block text-sm font-medium text-brand-700 underline hover:text-brand-900">
            Share your result
          </Link>
        </div>
      )}
    </section>
  );
}

/**
 * @param {{
 *   label: string,
 *   tone: 'emerald' | 'amber' | 'slate',
 *   data: { count: number, pct: number, avg: number | null },
 * }} props
 */
function OutcomeRow({ label, tone, data }) {
  const bar =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-amber-500"
        : "bg-slate-400";
  const avgText = data.avg != null ? `${data.avg.toFixed(1)} pts` : " - ";
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-brand-900">{label}</span>
        <span className="text-slate-600">
          avg {avgText} · {data.pct}%
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-brand-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, data.pct)}%` }} />
      </div>
    </div>
  );
}
