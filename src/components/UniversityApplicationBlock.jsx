import { Link } from "react-router-dom";
import {
  APPLICATION_DATES_DISCLAIMER,
  daysFromTodayTo,
  formatCountdown,
  formatDisplayDate,
  isDeadlineWithinDays,
} from "../lib/applicationDates.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

/**
 * @param {{ university: object, compact?: boolean, profileLink?: boolean }} props
 */
export default function UniversityApplicationBlock({ university: u, compact = false, profileLink = false }) {
  const hasWindow = u.applicationOpen || u.applicationClose;
  const applyHref = safeExternalUrl(u.applyUrl) || safeExternalUrl(u.website);
  const daysLeft = u.applicationClose ? daysFromTodayTo(u.applicationClose) : null;
  const urgent = u.applicationClose && isDeadlineWithinDays(u.applicationClose, 30);
  const countdown = u.applicationClose ? formatCountdown(u.applicationClose) : null;

  if (!hasWindow && !applyHref) return null;

  return (
    <div
      className={[
        "rounded-xl border p-3 text-xs",
        urgent && daysLeft != null && daysLeft >= 0
          ? "border-amber-300 bg-amber-50/80"
          : "border-brand-100 bg-brand-50/50",
      ].join(" ")}
    >
      <p className="font-semibold text-brand-900">Applications</p>
      {hasWindow ? (
        <p className="mt-1 text-slate-700">
          {u.applicationOpen && (
            <>
              Opens <span className="font-medium">{formatDisplayDate(u.applicationOpen)}</span>
              {u.applicationClose ? " · " : ""}
            </>
          )}
          {u.applicationClose && (
            <>
              closes <span className="font-medium">{formatDisplayDate(u.applicationClose)}</span>
            </>
          )}
          {u.academicYearStart ? (
            <span className="mt-0.5 block text-slate-600">Academic year: from {u.academicYearStart}</span>
          ) : null}
        </p>
      ) : (
        <p className="mt-1 text-slate-600">Dates not listed in Thuto - check the admissions site.</p>
      )}
      {urgent && countdown && daysLeft != null && daysLeft >= 0 ? (
        <p className="mt-2 font-semibold text-amber-900">{countdown}</p>
      ) : u.applicationClose && daysLeft != null && daysLeft < 0 ? (
        <p className="mt-2 font-medium text-slate-600">{countdown}</p>
      ) : null}
      {applyHref ? (
        <a
          href={applyHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-semibold text-brand-800 underline hover:text-brand-950"
        >
          Apply now
        </a>
      ) : null}
      <p className={compact ? "mt-2 text-[10px] leading-snug text-slate-500" : "mt-2 text-[11px] leading-snug text-slate-500"}>
        {APPLICATION_DATES_DISCLAIMER}
      </p>
      {compact && profileLink && u.id ? (
        <p className="mt-2">
          <Link to={`/universities/${u.id}`} className="font-medium text-brand-700 underline hover:text-brand-900">
            View profile & deadlines
          </Link>
        </p>
      ) : null}
    </div>
  );
}
