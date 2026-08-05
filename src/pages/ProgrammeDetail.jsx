import { useEffect, useMemo, useRef, useState } from "react";
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
import EligibilityPill from "../components/EligibilityPill.jsx";
import CareersList from "../components/CareersList.jsx";
import DocumentsChecklist from "../components/DocumentsChecklist.jsx";
import ProgrammePdfActions from "../components/ProgrammePdfActions.jsx";
import UpgradePrompt from "../components/UpgradePrompt.jsx";
import AdBanner from "../components/AdBanner.jsx";
import CompareSelectionBar from "../components/CompareSelectionBar.jsx";
import { useEntitlements } from "../hooks/useEntitlements.js";
import { fetchProgrammes, programmeBelongsToUniversity } from "../lib/programmesData.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import {
  getProgrammeAboutSummary,
  getProgrammeAccreditation,
  getProgrammeCampusLocation,
  getProgrammeCareers,
  getProgrammeInterests,
  getProgrammeRelatedSubjects,
  getSimilarProgrammes,
  isFitFinderCompatible,
} from "../lib/programmeInsights.js";
import { isAffirmativeStatus, isApplicationWindowOpen } from "../lib/institutionProfile.js";
import ExternalSiteLink from "../components/ExternalSiteLink.jsx";
import RequestInformationSection from "../components/RequestInformationSection.jsx";
import { trackProgrammeView } from "../lib/analytics.js";
import { buildTrackedApplyUrl } from "../lib/applyLinks.js";
import { fetchVerifiedInstitutionIds } from "../lib/partner.js";
import { safeExternalUrl } from "../lib/urlSafety.js";
import ProgrammeThemeHero from "../components/ProgrammeThemeHero.jsx";
import ProgrammeModulesSection from "../components/ProgrammeModulesSection.jsx";
import ProgrammeFeeSection from "../components/ProgrammeFeeSection.jsx";

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
  const [university, setUniversity] = useState(null);
  const [error, setError] = useState(null);
  const [verifiedInstitutionIds, setVerifiedInstitutionIds] = useState(() => new Set());
  const { toggle, isBookmarked, atLimit, maxBookmarks } = useBookmarks();
  const { ids: compareIds, toggle: toggleCompare, clear: clearCompare, isSelected, canAdd, max: compareMax } = useCompareSelection();
  const { entitlements } = useEntitlements();

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProgrammes(), fetchUniversities()])
      .then(([programmes, { list: universities }]) => {
        if (cancelled) return;
        setAllProgrammes(programmes);
        const found = programmes.find((p) => p.id === id);
        if (!found) {
          setError("Programme not found.");
          return;
        }
        setProgramme(found);
        const matchedUniversity = universities.find((u) => programmeBelongsToUniversity(found, u));
        setUniversity(matchedUniversity ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    fetchVerifiedInstitutionIds().then(setVerifiedInstitutionIds);
  }, []);

  useEffect(() => {
    if (programme) trackProgrammeView(programme);
  }, [programme?.id]);

  const similarProgrammes = useMemo(() => {
    return getSimilarProgrammes(programme, allProgrammes, 3);
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
  const otherRequirements = Array.isArray(programme.requirements)
    ? programme.requirements.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const predictorSnap = readPredictorSession();
  const eligibility =
    predictorSnap.grades != null && predictorSnap.total != null
      ? evaluateProgramme(programme, predictorSnap.grades, predictorSnap.total, {
          syllabusType: predictorSnap.syllabusType,
        })
      : null;

  const inCompare = isSelected(programme.id);
  const compareToggleDisabled = !inCompare && !canAdd;
  const applyHref = buildTrackedApplyUrl(programme.applyUrl, {
    programmeId: programme.id,
    institutionId: university?.id,
  });
  const officialHref = safeExternalUrl(programme.officialUrl);

  const hasApplicationBlock =
    programme.applicationDeadline ||
    applyHref ||
    officialHref;
  const applicationsClosed = !isApplicationWindowOpen(programme.applicationWindowStatus);

  const admissionListed = programmeHasAdmissionPoints(programme);
  const campusLocation = getProgrammeCampusLocation(programme, university?.location ?? null);
  const isDtefSponsored =
    programme.sponsorshipTier === "core" || university?.sponsorshipTier === "core";
  const aboutSummary = getProgrammeAboutSummary(programme);
  const interests = getProgrammeInterests(programme);
  const careers = getProgrammeCareers(programme);
  const accreditation = getProgrammeAccreditation(programme, university);
  const accreditationSourceHref = safeExternalUrl(accreditation.sourceUrl);
  const relatedSubjects = getProgrammeRelatedSubjects(programme);
  const fitCompatible = isFitFinderCompatible(programme);
  const isVerifiedPartner = Boolean(university?.id && verifiedInstitutionIds.has(university.id));

  return (
    <article className="space-y-6 pb-24 sm:pb-6">
      {entitlements.showAds ? <AdBanner /> : null}
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

      <header className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm">
        <ProgrammeThemeHero programme={programme} variant="detail" />
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-bold text-brand-900 sm:text-2xl">{programme.name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {programme.university}
                {programme.field ? ` · ${programme.field}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-start gap-2 sm:ml-auto">
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
                title={compareToggleDisabled ? `Compare allows at most ${compareMax} programmes` : undefined}
              >
                {inCompare ? "In compare" : "Add to compare"}
              </button>
              {entitlements.acceptanceChance && eligibility ? <EligibilityPill eligibility={eligibility} /> : null}
              {entitlements.pdfDownload ? (
                <ProgrammePdfActions programme={programme} university={university} compact />
              ) : null}
            </div>
          </div>
          {!entitlements.acceptanceChance && eligibility ? (
            <div className="mt-3">
              <UpgradePrompt feature="acceptanceChance" compact />
            </div>
          ) : null}
          {entitlements.acceptanceChance && eligibility?.reason ? (
            <p className="mt-3 text-sm text-slate-600">{eligibility.reason}</p>
          ) : null}
          {!isBookmarked(programme.id) && atLimit ? (
            <p className="mt-3 text-xs text-amber-900">
              Free plan allows {maxBookmarks} saved programmes.{" "}
              <Link to="/upgrade" className="font-semibold underline">
                Upgrade to Pro
              </Link>{" "}
              for unlimited saves.
            </p>
          ) : null}
          <ProgrammeAboutSummary summary={aboutSummary} programmeId={programme.id} />
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Duration</dt>
              <dd className="font-medium text-brand-900">{programme.duration ?? "Confirm with institution"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Minimum points</dt>
              <dd className="font-medium text-brand-900">
                {admissionListed ? `${programme.minPoints} (best six)` : "Not listed - confirm with the institution"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Campus location</dt>
              <dd className="font-medium text-brand-900">{campusLocation}</dd>
            </div>
            {programme.qualification ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Level</dt>
                <dd className="font-medium text-brand-900">{programme.qualification}</dd>
              </div>
            ) : null}
            {programme.faculty ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Faculty</dt>
                <dd className="font-medium text-brand-900">{programme.faculty}</dd>
              </div>
            ) : null}
            {programme.studyMode ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Study mode</dt>
                <dd className="font-medium text-brand-900">{programme.studyMode}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Accreditation</dt>
              <dd className="font-medium text-brand-900">
                {accreditation.status ? (
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      isAffirmativeStatus(accreditation.status)
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-700",
                    ].join(" ")}
                  >
                    {accreditation.status}
                  </span>
                ) : (
                  <span className="font-normal text-slate-500">Not listed — confirm with the institution</span>
                )}
              </dd>
              {accreditation.body ? <dd className="mt-1 text-xs text-slate-600">{accreditation.body}</dd> : null}
              {accreditation.notes ? <dd className="mt-1 text-xs text-slate-600">{accreditation.notes}</dd> : null}
              {accreditationSourceHref ? (
                <dd className="mt-1">
                  <ExternalSiteLink
                    href={accreditationSourceHref}
                    variant="inline"
                    institutionName={programme.university || university?.name}
                    institutionId={university?.id}
                    linkKind="website"
                    useInterstitial
                  >
                    Accreditation source
                  </ExternalSiteLink>
                </dd>
              ) : null}
            </div>
          </dl>
        </div>
      </header>

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Application</h2>
        {applicationsClosed ? (
          <p className="mt-2">
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
              Applications closed
            </span>
          </p>
        ) : null}
        {hasApplicationBlock ? (
          <>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {programme.applicationDeadline ? (
                <li>
                  <span className="font-medium text-slate-800">Deadline: </span>
                  {formatApplicationDeadline(programme.applicationDeadline)}
                </li>
              ) : null}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              {applyHref ? (
                <ExternalSiteLink
                  href={applyHref}
                  variant="programmePrimary"
                  institutionName={programme.university || university?.name}
                  programmeId={programme.id}
                  programmeName={programme.name}
                  institutionId={university?.id}
                  linkKind="apply"
                  useInterstitial
                >
                  Apply / admissions
                </ExternalSiteLink>
              ) : null}
              {officialHref ? (
                <ExternalSiteLink
                  href={officialHref}
                  variant="programmeSecondary"
                  institutionName={programme.university || university?.name}
                  programmeId={programme.id}
                  institutionId={university?.id}
                  linkKind="website"
                  useInterstitial
                >
                  Official programme page
                </ExternalSiteLink>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Verify dates and requirements on the institution&apos;s site before you apply.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Application links and deadlines are not listed in Thuto yet. Check the institution&apos;s admissions office
            or official website.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Entry requirements</h2>
        <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
          {Object.entries(reqs).map(([key, grade]) => (
            <li key={key}>
              <span className="font-medium">{REQ_LABEL[key] ?? key.replace(/([A-Z])/g, " $1").trim()}</span>: at least{" "}
              {grade}
            </li>
          ))}
          {otherRequirements.map((requirement) => (
            <li key={requirement}>{requirement}</li>
          ))}
        </ul>
        {!Object.keys(reqs).length && !otherRequirements.length && (
          <p className="text-sm text-slate-500">
            {admissionListed
              ? "No subject-specific requirements listed in Thuto for this programme."
              : "Subject-specific grade requirements are not listed in Thuto yet - check the prospectus or admissions office."}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Smart programme guide</h2>
        <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <InsightBlock title="Best for students interested in" items={interests} empty="Interest tags are not listed yet." />
          <InsightBlock title="Related careers" items={careers.slice(0, entitlements.careersPerProgramme)} empty="Career examples are not listed yet." />
          <InsightBlock title="Subjects that help" items={relatedSubjects} empty="Related subjects are not listed yet." />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Fit Finder compatible</p>
            <p className="mt-1 text-slate-700">
              {fitCompatible
                ? "Yes - this profile has enough local signals for rule-based matching."
                : "Limited - matching can still work, but this profile has missing local data."}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {programme.studyMode ? (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-900">
              {programme.studyMode}
            </span>
          ) : null}
          {(programme.tags || []).slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {tag}
            </span>
          ))}
          {!programme.studyMode && !(programme.tags || []).length ? (
            <span className="text-xs text-slate-500">Study mode and tags are not listed for this programme.</span>
          ) : null}
        </div>
      </section>

      <ProgrammeModulesSection programme={programme} />

      <ProgrammeFeeSection programme={programme} university={university} isDtefSponsored={isDtefSponsored} />

      <DocumentsChecklist programme={programme} locked={!entitlements.documentsChecklist} />

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">
          Career prospects &amp; salary estimates
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Roles this programme commonly leads to. Salary ranges are broad market estimates, not offers.
        </p>
        <div className="mt-3">
          <CareersList
            careers={careers}
            maxCareers={entitlements.careersPerProgramme}
            showSalary={entitlements.showSalaryEstimates}
            programme={programme}
            empty="Career prospects are being prepared for this programme."
          />
        </div>
      </section>

      <RequestInformationSection
        university={university}
        programmeId={programme.id}
        programmeName={programme.name}
        isVerifiedPartner={isVerifiedPartner}
      />

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

function ProgrammeAboutSummary({ summary, programmeId }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const paragraphRef = useRef(null);

  useEffect(() => {
    setExpanded(false);
  }, [programmeId]);

  useEffect(() => {
    const el = paragraphRef.current;
    if (!el || expanded) return;

    const measure = () => {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [summary, expanded, programmeId]);

  const showToggle = isTruncated || expanded;

  return (
    <section className="mt-4">
      <h2 className="font-display text-base font-semibold text-brand-900">About this programme</h2>
      <p
        ref={paragraphRef}
        className={[
          "mt-2 text-sm leading-relaxed text-slate-700",
          !expanded && "line-clamp-3",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {summary}
      </p>
      {showToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </section>
  );
}

function InsightBlock({ title, items, empty }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      {items.length ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.slice(0, 6).map((item) => (
            <li key={item} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-900">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-slate-500">{empty}</p>
      )}
    </div>
  );
}
