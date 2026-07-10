import ExternalSiteLink from "./ExternalSiteLink.jsx";
import { formatFeeAmount, getUniversityFeeSchedule } from "../lib/universityFees.js";

function FeeCell({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-brand-900">{value}</dd>
    </div>
  );
}

function GroupCard({ schedule, group }) {
  const { estimates } = group;
  const isPerCredit = schedule.basis === "per_credit";

  return (
    <li className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
      <h3 className="font-display text-sm font-semibold text-brand-900">{group.name}</h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isPerCredit ? (
          <FeeCell label="Per credit" value={formatFeeAmount(estimates?.perCredit, estimates?.currency)} />
        ) : null}
        <FeeCell label="Per semester (est.)" value={formatFeeAmount(estimates?.perSemester, estimates?.currency)} />
        {isPerCredit ? (
          <FeeCell
            label="Total credits"
            value={estimates?.totalCredits != null ? String(estimates.totalCredits) : null}
          />
        ) : null}
        <FeeCell label="Total programme (est.)" value={formatFeeAmount(estimates?.totalProgramme, estimates?.currency)} />
      </dl>
      {group.note ? <p className="mt-3 text-xs leading-relaxed text-slate-600">{group.note}</p> : null}
    </li>
  );
}

export default function UniversityFacultyFeesSection({ university }) {
  const schedule = getUniversityFeeSchedule(university);
  if (!schedule) return null;

  const isPerCredit = schedule.basis === "per_credit";
  const sourceHref = schedule.sourceUrl || null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand-900">Tuition fees by faculty</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {isPerCredit
              ? "Many universities in Botswana charge per credit — multiply your registered credits each semester by the faculty rate."
              : "This institution publishes programme or semester totals rather than a single per-credit rate."}
          </p>
        </div>
        {schedule.academicYear ? (
          <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-950">
            {schedule.academicYear}
          </p>
        ) : null}
      </div>

      {schedule.description ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{schedule.description}</p>
      ) : null}

      {schedule.audienceNote ? (
        <p className="mt-2 text-xs text-amber-950/90">{schedule.audienceNote}</p>
      ) : null}

      {isPerCredit && schedule.normalSemesterCredits ? (
        <p className="mt-3 text-sm text-slate-700">
          <span className="font-medium text-slate-800">Normal semester load: </span>
          {schedule.normalSemesterCredits} credits
          {schedule.semestersPerYear ? ` (${schedule.semestersPerYear} semesters per year)` : ""}.
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {schedule.groups.map((group) => (
          <GroupCard key={group.id} schedule={schedule} group={group} />
        ))}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Figures are indicative for {schedule.audience === "citizen" ? "citizens and residents" : "domestic students"}.
        Excursion, registration, and other charges may apply on top of tuition. Always confirm on the official fee
        schedule before you budget.
      </p>

      {sourceHref ? (
        <div className="mt-3">
          <ExternalSiteLink
            href={sourceHref}
            variant="secondary"
            institutionName={university.name}
            useInterstitial
          >
            Official {schedule.academicYear ? `${schedule.academicYear} ` : ""}fee schedule
          </ExternalSiteLink>
        </div>
      ) : null}
    </section>
  );
}
