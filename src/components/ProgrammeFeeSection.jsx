import { Link } from "react-router-dom";
import { formatFeeAmount, resolveProgrammeFees } from "../lib/universityFees.js";
import ExternalSiteLink from "./ExternalSiteLink.jsx";

export default function ProgrammeFeeSection({ programme, university, isDtefSponsored }) {
  const { source, fees, scheduleLookup } = resolveProgrammeFees(programme, university);
  const schedule = scheduleLookup?.schedule;
  const group = scheduleLookup?.group;
  const estimates = scheduleLookup?.estimates;

  const durationYears = programme?.durationYears ?? group?.durationYears ?? null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-brand-900">Fee &amp; funding</h2>
        {isDtefSponsored ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-950"
            title="This programme or institution is on Thuto's DTEF sponsorship list — confirm eligibility with DTEF"
          >
            <span className="size-1.5 rounded-full bg-emerald-600" aria-hidden />
            DTEF Sponsored
          </span>
        ) : null}
      </div>

      {source === "programme" ? (
        <p className="mt-2 text-sm text-slate-700">
          <span className="font-medium text-slate-800">Estimated fees: </span>
          from approximately{" "}
          <strong>
            {fees.currency} {fees.domestic.toLocaleString()}
          </strong>
          {fees.per ? ` per ${fees.per}` : ""} (domestic). Figures are indicative — always confirm with the
          institution.
        </p>
      ) : null}

      {source === "schedule" && estimates ? (
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-800">Fee model: </span>
            {schedule.basis === "per_credit"
              ? `${university?.name || "This institution"} charges per credit.`
              : "Fixed programme or semester fees apply."}
            {group?.name ? (
              <>
                {" "}
                This programme is grouped with <strong>{group.name}</strong>.
              </>
            ) : null}
          </p>

          {estimates.perCredit != null ? (
            <p>
              <span className="font-medium text-slate-800">Per credit: </span>
              {formatFeeAmount(estimates.perCredit, estimates.currency)}
              {schedule.audience === "citizen" ? " (citizen/resident rate)" : ""}.
            </p>
          ) : null}

          {estimates.perSemester != null ? (
            <p>
              <span className="font-medium text-slate-800">Per semester (est.): </span>
              {formatFeeAmount(estimates.perSemester, estimates.currency)}
              {estimates.normalSemesterCredits
                ? ` at ${estimates.normalSemesterCredits} credits`
                : ""}
              .
            </p>
          ) : null}

          {estimates.totalProgramme != null ? (
            <p>
              <span className="font-medium text-slate-800">Total programme (est.): </span>
              {formatFeeAmount(estimates.totalProgramme, estimates.currency)}
              {estimates.totalCredits ? ` for ${estimates.totalCredits} credits` : ""}
              {durationYears ? ` over about ${durationYears} years` : ""}.
            </p>
          ) : null}

          {group?.note ? <p className="text-xs leading-relaxed text-slate-600">{group.note}</p> : null}

          {schedule.audienceNote ? (
            <p className="text-xs leading-relaxed text-amber-950/90">{schedule.audienceNote}</p>
          ) : null}
        </div>
      ) : null}

      {!source ? (
        <p className="mt-2 text-sm text-slate-700">
          <span className="font-medium text-slate-800">Estimated fees: </span>
          not listed in Thuto yet. Check the institution&apos;s fee schedule or prospectus.
        </p>
      ) : null}

      {fees?.note ? <p className="mt-2 text-sm text-amber-950/90">{fees.note}</p> : null}

      {isDtefSponsored ? (
        <p className="mt-3 text-sm text-emerald-950/90">
          Listed as eligible for government tertiary sponsorship through DTEF. Final eligibility depends on DTEF rules,
          your results, and available places — confirm on the{" "}
          <Link to="/sponsorships" className="font-medium text-emerald-900 underline hover:text-emerald-950">
            sponsorship guide
          </Link>
          .
        </p>
      ) : null}

      {schedule?.sourceUrl ? (
        <div className="mt-3">
          <ExternalSiteLink
            href={schedule.sourceUrl}
            variant="inline"
            institutionName={university?.name || programme?.university}
            useInterstitial
          >
            Official fee schedule
          </ExternalSiteLink>
        </div>
      ) : null}
    </section>
  );
}
