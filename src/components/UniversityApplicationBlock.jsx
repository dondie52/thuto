import { Link } from "react-router-dom";
import ExternalSiteLink from "./ExternalSiteLink.jsx";
import {
  APPLICATION_DATES_DISCLAIMER,
  daysFromTodayTo,
  formatCountdown,
  formatDisplayDate,
  isDeadlineWithinDays,
} from "../lib/applicationDates.js";
import { isApplicationWindowOpen } from "../lib/institutionProfile.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

function ApplicationsClosedPill() {
  return (
    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
      Applications closed
    </span>
  );
}

/**
 * @param {{ university: object, compact?: boolean, profileLink?: boolean }} props
 */
export default function UniversityApplicationBlock({ university: u, compact = false, profileLink = false }) {
  const hasWindow = u.applicationOpen || u.applicationClose;
  const applyHref = safeExternalUrl(u.applyUrl) || safeExternalUrl(u.website);
  // A closed window is the institution's own word on it, so it outranks the date maths.
  const windowClosed = !isApplicationWindowOpen(u.applicationWindowStatus);
  const daysLeft = u.applicationClose ? daysFromTodayTo(u.applicationClose) : null;
  const urgent = !windowClosed && u.applicationClose && isDeadlineWithinDays(u.applicationClose, 30);
  const countdown = !windowClosed && u.applicationClose ? formatCountdown(u.applicationClose) : null;

  if (!hasWindow && !applyHref) return null;

  if (compact) {
    const summary = hasWindow
      ? [
          u.applicationOpen ? `Opens ${formatDisplayDate(u.applicationOpen)}` : null,
          u.applicationClose ? `Closes ${formatDisplayDate(u.applicationClose)}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Dates not listed in Thuto - check the admissions site.";

    return (
      <div
        className={[
          "rounded-xl border p-3 text-xs",
          urgent && daysLeft != null && daysLeft >= 0
            ? "border-amber-300 bg-amber-50/80"
            : "border-brand-100 bg-brand-50/50",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-900">Applications</p>
              {windowClosed ? <ApplicationsClosedPill /> : null}
            </div>
            <p className="mt-1 leading-relaxed text-slate-700">{summary}</p>
            {urgent && countdown && daysLeft != null && daysLeft >= 0 ? (
              <p className="mt-1 font-semibold text-amber-900">{countdown}</p>
            ) : countdown && u.applicationClose && daysLeft != null && daysLeft < 0 ? (
              <p className="mt-1 font-medium text-slate-600">{countdown}</p>
            ) : null}
          </div>
          {applyHref ? (
            <ExternalSiteLink
              href={applyHref}
              variant="compact"
              institutionName={u.name}
              institutionId={u.id}
              linkKind="apply"
              useInterstitial
            >
              Apply
            </ExternalSiteLink>
          ) : null}
        </div>
        {profileLink && u.id ? (
          <p className="mt-2">
            <Link to={`/universities/${u.id}`} className="font-medium text-brand-700 underline hover:text-brand-900">
              View profile & deadlines
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={[
        "rounded-xl border p-3 text-xs",
        urgent && daysLeft != null && daysLeft >= 0
          ? "border-amber-300 bg-amber-50/80"
          : "border-brand-100 bg-brand-50/50",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-brand-900">Applications</p>
        {windowClosed ? <ApplicationsClosedPill /> : null}
      </div>
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
      ) : countdown && u.applicationClose && daysLeft != null && daysLeft < 0 ? (
        <p className="mt-2 font-medium text-slate-600">{countdown}</p>
      ) : null}
      {applyHref ? (
        <ExternalSiteLink
          href={applyHref}
          variant="text"
          institutionName={u.name}
          institutionId={u.id}
          linkKind="apply"
          useInterstitial
          className="mt-2 inline-block"
        >
          Apply now
        </ExternalSiteLink>
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
