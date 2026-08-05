import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  evaluateAllProgrammes,
  clearPredictorSession,
} from "../lib/admissions.js";
import { usePredictorGradeInput } from "../hooks/usePredictorGradeInput.js";
import { useProfileGradePersistence } from "../hooks/useProfileGradePersistence.js";
import PredictorGradeSection from "../components/PredictorGradeSection.jsx";
import ProgrammePredictorResults from "../components/ProgrammePredictorResults.jsx";
import CertificateImportCard from "../components/CertificateImportCard.jsx";
import UpgradePrompt from "../components/UpgradePrompt.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useEntitlements } from "../hooks/useEntitlements.js";
import { useAuth } from "../lib/auth.jsx";
import { hasPredictorAccess } from "../lib/onboarding.js";
import { filterSubjectsBySyllabus } from "../lib/syllabus.js";
import {
  ALL_SYLLABUS_VALUES,
  CROSS_SYLLABUS_DISCLAIMER,
  GUIDANCE_SCALE_NOTICE,
} from "../lib/gradingSystems.js";
import { fetchProgrammes } from "../lib/programmesData.js";
import { scrollElementIntoView } from "../lib/motion.js";

/**
 * The syllabus has to be named: a bare "38 pts" reads as BGCSE to anyone who sees it, which is
 * wrong for an APS of 38 and badly wrong for a WASSCE aggregate where lower is better.
 */
function buildShareText(breakdownTotal, results, profile) {
  const qualified = results.filter((r) => r.status === "Qualified");
  const origin =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : "https://thuto.bw";
  const score = `${breakdownTotal} ${profile.abbreviation} ${profile.aggregate === "aps" ? "APS" : "pts"}`;
  if (qualified.length === 0) {
    return `I scored ${score} on Thuto. Check yours at ${origin}`;
  }
  const first = qualified[0].programme.name;
  if (qualified.length === 1) {
    return `I scored ${score} on Thuto - I may qualify for ${first}. Check yours at ${origin}`;
  }
  const second = qualified[1].programme.name;
  const more = qualified.length - 2;
  const tail = more > 0 ? `, ${second} and ${more} more` : ` and ${second}`;
  return `I scored ${score} on Thuto - I may qualify for ${first}${tail}. Check yours at ${origin}`;
}

export default function Predictor() {
  useDocumentTitle("Admission Predictor | Thuto");
  const { user, profile } = useAuth();
  const { entitlements } = useEntitlements();
  const [programmes, setProgrammes] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [shareFeedback, setShareFeedback] = useState(null);
  const resultsSectionRef = useRef(null);
  const hasAutoScrolledToResultsRef = useRef(false);
  const syllabusType = profile?.syllabus_type || "";
  const {
    rows,
    chosenSubjectIds,
    validationMessage,
    breakdown,
    requirementGrades,
    updateRow,
    addRow,
    removeRow,
    resetRows,
    replaceRows,
    canAdd,
    bgcseSubjects,
    gradeOptions,
    gradeChoices,
    gradingProfile,
  } = usePredictorGradeInput({ syllabusType: syllabusType || "bgcse" });

  const { gradesNotice, clearSavedGrades } = useProfileGradePersistence({
    user,
    rows,
    replaceRows,
    validationMessage,
    breakdown,
  });

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    fetchProgrammes({ signal: ac.signal })
      .then((data) => {
        if (!cancelled) setProgrammes(data);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const results = useMemo(() => {
    if (!programmes.length || !requirementGrades || !breakdown || breakdown.invalid) return null;
    return evaluateAllProgrammes(programmes, requirementGrades, breakdown.total, { syllabusType });
  }, [programmes, requirementGrades, breakdown, syllabusType]);

  const summary = useMemo(() => {
    if (!results) return null;
    return results.reduce(
      (acc, r) => {
        acc[r.status] += 1;
        return acc;
      },
      { Qualified: 0, Close: 0, "Not eligible": 0, Unknown: 0 },
    );
  }, [results]);

  useEffect(() => {
    if (!results || !summary || !breakdown) return;
    if (hasAutoScrolledToResultsRef.current) return;
    hasAutoScrolledToResultsRef.current = true;
    requestAnimationFrame(() => {
      scrollElementIntoView(resultsSectionRef.current, { block: "nearest" });
    });
  }, [results, summary, breakdown]);

  function handleReset() {
    clearPredictorSession();
    clearSavedGrades();
    resetRows();
    hasAutoScrolledToResultsRef.current = false;
    setShareFeedback(null);
  }

  function scrollToGradeSection() {
    scrollElementIntoView(document.getElementById("predictor-grade-section"), { block: "start" });
  }

  function handleImportedRows(importedRows) {
    replaceRows(importedRows);
    hasAutoScrolledToResultsRef.current = false;
    setShareFeedback(null);
    requestAnimationFrame(() => {
      scrollElementIntoView(document.getElementById("predictor-grade-section"), { block: "start" });
    });
  }

  async function handleShare() {
    if (!breakdown || breakdown.invalid || !results?.length) return;
    const text = buildShareText(breakdown.total, results, gradingProfile);
    try {
      await navigator.clipboard.writeText(text);
      setShareFeedback("Copied summary - paste into WhatsApp or notes.");
    } catch {
      setShareFeedback("Could not access clipboard. Try copying from your browser menu.");
    }
    window.setTimeout(() => setShareFeedback(null), 4000);
  }

  const hasResults = Boolean(results && summary);
  const predictorLocked = Boolean(user && !hasPredictorAccess(profile));
  const activeSubjects = useMemo(
    () => (syllabusType ? filterSubjectsBySyllabus(syllabusType, bgcseSubjects) : bgcseSubjects),
    [syllabusType, bgcseSubjects],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Admission Predictor</h1>
        <p className="mt-2 text-sm text-slate-600">
          Thuto works out your {gradingProfile.aggregateLabel.toLowerCase()} and shows programmes you may qualify for.
        </p>
        <p className="mt-2 text-xs text-slate-500">{gradingProfile.helpText}</p>
        {!gradingProfile.verified ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
            {GUIDANCE_SCALE_NOTICE}
          </p>
        ) : null}
        {gradingProfile.id !== "bgcse" ? (
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{CROSS_SYLLABUS_DISCLAIMER}</p>
        ) : null}
      </div>

      <ol className="grid gap-3 sm:grid-cols-2" aria-label="Eligibility check steps">
        <li
          className={[
            "rounded-2xl border p-4 shadow-sm",
            hasResults ? "border-emerald-200 bg-emerald-50/70" : "border-brand-200 bg-white",
          ].join(" ")}
        >
          <h2 className="font-display text-base font-semibold text-brand-900">Add grades</h2>
        </li>
        <li
          className={[
            "rounded-2xl border p-4 shadow-sm",
            hasResults ? "border-brand-200 bg-white" : "border-stone-200 bg-stone-50/80",
          ].join(" ")}
        >
          <h2 className="font-display text-base font-semibold text-brand-900">Review your matches</h2>
        </li>
      </ol>

      {loadError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {loadError}
        </p>
      )}

      {predictorLocked ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-relaxed text-brand-900">
          <p className="font-semibold">Choose your syllabus to unlock the Predictor</p>
          <p className="mt-1 text-brand-800/90">
            Search for the exam system on your certificate — Thuto covers {ALL_SYLLABUS_VALUES.length} systems
            across Africa — so we can score you on the right grading scale.
          </p>
          <Link
            to="/onboarding?next=%2Fpredictor&step=academics"
            className="focus-ring mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Set up academics
          </Link>
        </div>
      ) : (
        <>
          {entitlements.gradeImport ? (
            <CertificateImportCard onUseGrades={handleImportedRows} />
          ) : (
            <UpgradePrompt
              feature="gradeImport"
              message="Upload a certificate photo or PDF to auto-fill grades with Thuto Pro. Free accounts can type grades manually below."
            />
          )}

          {gradesNotice ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
              {gradesNotice}
            </p>
          ) : null}

          <PredictorGradeSection
            rows={rows}
            chosenSubjectIds={chosenSubjectIds}
            validationMessage={validationMessage}
            breakdown={breakdown}
            updateRow={updateRow}
            addRow={addRow}
            removeRow={removeRow}
            canAdd={canAdd}
            subjects={activeSubjects}
            gradeOptions={gradeOptions}
            gradeChoices={gradeChoices}
            helpText={gradingProfile.helpText}
            allowScienceDouble={Boolean(gradingProfile.allowsScienceDouble)}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-100"
            >
              Clear all
            </button>
          </div>
        </>
      )}

      {!predictorLocked && results && summary && (
        <ProgrammePredictorResults
          results={results}
          summary={summary}
          onEditGrades={scrollToGradeSection}
          onShare={handleShare}
          shareFeedback={shareFeedback}
          sectionRef={resultsSectionRef}
        />
      )}
    </div>
  );
}
