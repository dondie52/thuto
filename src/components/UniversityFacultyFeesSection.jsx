import ExternalSiteLink from "./ExternalSiteLink.jsx";
import { formatFeeAmount, getUniversityFeeSchedule, resolveApplicationFee } from "../lib/universityFees.js";

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

export default function UniversityFacultyFeesSection({ university, applicationSettings = null }) {
  const schedule = getUniversityFeeSchedule(university);
  const applicationFee = resolveApplicationFee(null, university, applicationSettings);

  // Only 3 of 389 institutions publish a fee schedule. Rendering the box with nothing in it
  // would put an empty card on almost every institution page.
  if (!schedule && !applicationFee) return null;

  const isPerCredit = schedule?.basis === "per_credit";
  const sourceHref = schedule?.sourceUrl || null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand-900">Fees</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            What it costs to apply, and what tuition looks like once you are in.
          </p>
        </div>
        {schedule?.academicYear ? (
          <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-950">
            {schedule.academicYear}
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-white/70 p-4">
        <h3 className="font-display text-sm font-semibold text-brand-900">Application fee</h3>
        <p className="mt-1 text-sm text-slate-700">
          {applicationFee ? (
            <>
              <strong>{formatFeeAmount(applicationFee.amount, applicationFee.currency)}</strong>
              {applicationFee.amount === 0
                ? " — this institution does not charge an application fee."
                : " payable when you submit your application. Usually non-refundable."}
            </>
          ) : (
            "Not listed in Thuto yet. Confirm with the admissions office before you apply."
          )}
        </p>
        {applicationFee?.note ? (
          <p className="mt-1 text-xs leading-relaxed text-amber-950/90">{applicationFee.note}</p>
        ) : null}
      </div>

      {!schedule ? (
        <p className="mt-4 text-sm text-slate-700">
          <span className="font-medium text-slate-800">Tuition by faculty: </span>
          not listed in Thuto yet. Check the institution&apos;s official fee schedule or prospectus.
        </p>
      ) : null}

      {schedule ? (
        <>
          <h3 className="mt-5 font-display text-sm font-semibold text-brand-900">Tuition fees by faculty</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {isPerCredit
              ? "Many universities in Botswana charge per credit — multiply your registered credits each semester by the faculty rate."
              : "This institution publishes programme or semester totals rather than a single per-credit rate."}
          </p>

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
            Figures are indicative for{" "}
            {schedule.audience === "citizen" ? "citizens and residents" : "domestic students"}. Excursion,
            registration, and other charges may apply on top of tuition. Always confirm on the official fee schedule
            before you budget.
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
        </>
      ) : null}
    </section>
  );
}
