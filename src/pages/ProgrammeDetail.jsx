import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  evaluateProgramme,
  programmeHasAdmissionPoints,
  readPredictorSession,
  SUBJECT_FIELDS,
} from "../lib/admissions.js";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { useCompareSelection } from "../hooks/useCompareSelection.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import ProgrammeBookmarkButton from "../components/ProgrammeBookmarkButton.jsx";
import ProgrammeCommunityStats from "../components/ProgrammeCommunityStats.jsx";
import EligibilityPill from "../components/EligibilityPill.jsx";
import CompareSelectionBar from "../components/CompareSelectionBar.jsx";
import { fetchProgrammes } from "../lib/programmesData.js";

const REQ_LABEL = Object.fromEntries(SUBJECT_FIELDS.map(({ key, label }) => [key, label]));

function formatApplicationDeadline(iso) {
  if (iso == null || String(iso).trim() === "") return null;
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function ProgrammeDetail() {
  const { id } = useParams();
  const location = useLocation();
  const programmesListHref = `/programmes${location.state?.fromProgrammes ?? ""}`;
  const [programme, setProgramme] = useState(null);
  const [allProgrammes, setAllProgrammes] = useState([]);
  const [error, setError] = useState(null);
  const { toggle, isBookmarked } = useBookmarks();
  const { ids: compareIds, toggle: toggleCompare, clear: clearCompare, isSelected, canAdd } = useCompareSelection();

  useEffect(() => {
    let cancelled = false;
    fetchProgrammes()
      .then((data) => {
        if (cancelled) return;
        setAllProgrammes(data);
        const found = data.find((p) => p.id === id);
        if (!found) setError("Programme not found.");
        else setProgramme(found);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const similarProgrammes = useMemo(() => {
    if (!programme) return [];
    const others = allProgrammes.filter((p) => p.id !== programme.id);
    const byField = others.filter((p) => p.field === programme.field);
    const byUni = others.filter((p) => p.field !== programme.field && p.university === programme.university);
    const merged = [...byField, ...byUni];
    const seen = new Set();
    const out = [];
    for (const p of merged) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
      if (out.length >= 3) break;
    }
    return out;
  }, [programme, allProgrammes]);

  const documentTitle = error
    ? "Programme not found - Thuto"
    : programme
      ? `${programme.name} - ${programme.university} | Thuto`
      : "Programme - Thuto";
  useDocumentTitle(documentTitle);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-800">{error}</p>
        <Link to={programmesListHref} className="text-sm font-medium text-brand-700 underline">
          Back to programmes
        </Link>
      </div>
    );
  }

  if (!programme) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const reqs = programme.subjectRequirements || {};
  const predictorSnap = readPredictorSession();
  const eligibility =
    predictorSnap.grades != null && predictorSnap.total != null
      ? evaluateProgramme(programme, predictorSnap.grades, predictorSnap.total)
      : null;

  const fees = programme.fees;
  const hasFees =
    fees &&
    typeof fees.domestic === "number" &&
    Number.isFinite(fees.domestic) &&
    fees.currency;

  const inCompare = isSelected(programme.id);
  const compareToggleDisabled = !inCompare && !canAdd;

  const hasApplicationBlock =
    programme.applicationDeadline ||
    programme.applyUrl ||
    programme.officialUrl;

  const admissionListed = programmeHasAdmissionPoints(programme);
  const profileCompleteness = programme.profileCompleteness ?? (programme.modules?.length && programme.careers?.length ? "full" : "partial");

  return (
    <article className="space-y-6 pb-24 sm:pb-6">
      <Link to={programmesListHref} className="inline-block text-sm font-medium text-brand-700 hover:underline">
        ← Programmes
      </Link>

      {!admissionListed ? (
        <p
          className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
          role="status"
        >
          Minimum points and grade rules for this programme are not verified in Thuto yet. Use the links below and
          confirm entry requirements on the institution&apos;s official admissions information.
        </p>
      ) : null}

      <header className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold text-brand-900 sm:text-2xl">{programme.name}</h1>
            <p className="mt-1 text-sm text-slate-600">{programme.university}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-start gap-2">
            <ProgrammeBookmarkButton
              programmeId={programme.id}
              programmeName={programme.name}
              pressed={isBookmarked(programme.id)}
              onToggle={() => toggle(programme.id)}
            />
            <button
              type="button"
              disabled={compareToggleDisabled}
              onClick={() => toggleCompare(programme.id)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                inCompare
                  ? "border-brand-600 bg-brand-100 text-brand-900"
                  : "border-brand-200 bg-white text-brand-800 hover:bg-brand-50",
                compareToggleDisabled && "cursor-not-allowed opacity-50",
              ]
                .filter(Boolean)
                .join(" ")}
              title={compareToggleDisabled ? "Compare allows at most 3 programmes" : undefined}
            >
              {inCompare ? "In compare" : "Add to compare"}
            </button>
            {eligibility ? <EligibilityPill eligibility={eligibility} /> : null}
          </div>
        </div>
        {eligibility?.reason && <p className="mt-3 text-sm text-slate-600">{eligibility.reason}</p>}
        {predictorSnap.total != null && predictorSnap.grades == null && (
          <p className="mt-3 text-sm text-slate-600">
            Use the{" "}
            <Link to="/predictor" className="font-medium text-brand-700 underline hover:text-brand-900">
              predictor
            </Link>{" "}
            with your subjects saved to see grade requirements compared to your results.
          </p>
        )}
        {predictorSnap.total == null && (
          <p className="mt-3 text-sm text-slate-600">
            <Link to="/predictor" className="font-medium text-brand-700 underline hover:text-brand-900">
              Run the admission predictor
            </Link>{" "}
            to compare your best-six points and grades with this programme.
          </p>
        )}
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Duration</dt>
            <dd className="font-medium text-brand-900">{programme.duration}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Minimum points</dt>
            <dd className="font-medium text-brand-900">
              {admissionListed ? `${programme.minPoints} (best six)` : "Not listed - confirm with the institution"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Profile quality</dt>
            <dd className="font-medium text-brand-900">{profileCompleteness === "full" ? "Full profile" : "Partial profile"}</dd>
          </div>
        </dl>
      </header>

      <ProgrammeCommunityStats programmeId={programme.id} />

      {programme.description ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">About this programme</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{programme.description}</p>
        </section>
      ) : (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">About this programme</h2>
          <p className="mt-3 text-sm text-slate-500">Profile overview is coming soon for this programme.</p>
        </section>
      )}

      {hasApplicationBlock ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">Application</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {programme.applicationDeadline ? (
              <li>
                <span className="font-medium text-slate-800">Deadline: </span>
                {formatApplicationDeadline(programme.applicationDeadline)}
              </li>
            ) : null}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            {programme.applyUrl ? (
              <a
                href={programme.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
              >
                Apply / admissions
              </a>
            ) : null}
            {programme.officialUrl ? (
              <a
                href={programme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm hover:bg-brand-50"
              >
                Official programme page
              </a>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-slate-500">Verify dates and requirements on the institution&apos;s site before you apply.</p>
        </section>
      ) : null}

      {hasFees ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">Tuition (approximate)</h2>
          <p className="mt-2 text-sm text-slate-700">
            From approximately{" "}
            <strong>
              {fees.currency} {fees.domestic.toLocaleString()}
            </strong>
            {fees.per ? ` per ${fees.per}` : ""} (domestic). Figures are indicative - always confirm with the
            institution.
          </p>
          {fees.note ? <p className="mt-2 text-sm text-amber-950/90">{fees.note}</p> : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Entry requirements (grades)</h2>
        <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
          {Object.entries(reqs).map(([key, grade]) => (
            <li key={key}>
              <span className="font-medium">{REQ_LABEL[key] ?? key.replace(/([A-Z])/g, " $1").trim()}</span>: at least{" "}
              {grade}
            </li>
          ))}
        </ul>
        {!Object.keys(reqs).length && (
          <p className="text-sm text-slate-500">
            {admissionListed
              ? "No subject-specific requirements listed in Thuto for this programme."
              : "Subject-specific grade requirements are not listed in Thuto yet - check the prospectus or admissions office."}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Modules by semester</h2>
        <ul className="mt-3 space-y-4">
          {(programme.modules || []).map((block) => (
            <li key={block.semester}>
              <p className="text-sm font-semibold text-brand-800">Semester {block.semester}</p>
              <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                {(block.modules || []).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {!(programme.modules || []).length && (
          <p className="text-sm text-slate-500">Module sample is coming soon. Check the official page in the meantime.</p>
        )}
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Career prospects</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(programme.careers || []).map((c) => (
            <li key={c} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-900">
              {c}
            </li>
          ))}
        </ul>
        {!(programme.careers || []).length && (
          <p className="text-sm text-slate-500">Career prospects are being prepared for this programme.</p>
        )}
      </section>

      {similarProgrammes.length > 0 ? (
        <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-brand-900">Similar programmes</h2>
          <ul className="mt-3 divide-y divide-brand-100 rounded-lg border border-brand-100">
            {similarProgrammes.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/programmes/${p.id}`}
                  state={{ fromProgrammes: location.state?.fromProgrammes ?? "" }}
                  className="flex flex-col gap-0.5 px-3 py-3 text-sm transition hover:bg-brand-50"
                >
                  <span className="font-medium text-brand-900">{p.name}</span>
                  <span className="text-xs text-slate-500">
                    {p.university}
                    {p.field ? ` · ${p.field}` : ""}
                  </span>
                  <span className="text-xs font-medium text-brand-700">
                    {programmeHasAdmissionPoints(p) ? `Min ${p.minPoints} pts` : "Min pts not listed"} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {compareIds.length > 0 ? <CompareSelectionBar ids={compareIds} onClear={clearCompare} /> : null}
    </article>
  );
}
