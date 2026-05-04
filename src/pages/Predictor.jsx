import { useEffect, useMemo, useRef, useState } from "react";
import {
  evaluateAllProgrammes,
  clearPredictorSession,
} from "../lib/admissions.js";
import { usePredictorGradeInput } from "../hooks/usePredictorGradeInput.js";
import PredictorGradeSection from "../components/PredictorGradeSection.jsx";
import ProgrammePredictorResults from "../components/ProgrammePredictorResults.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

function buildShareText(breakdownTotal, results) {
  const qualified = results.filter((r) => r.status === "Qualified");
  const origin =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : "https://thuto.bw";
  if (qualified.length === 0) {
    return `I scored ${breakdownTotal} pts on Thuto. Check yours at ${origin}`;
  }
  const first = qualified[0].programme.name;
  if (qualified.length === 1) {
    return `I scored ${breakdownTotal} pts on Thuto - I qualify for ${first}. Check yours at ${origin}`;
  }
  const second = qualified[1].programme.name;
  const more = qualified.length - 2;
  const tail = more > 0 ? `, ${second} and ${more} more` : ` and ${second}`;
  return `I scored ${breakdownTotal} pts on Thuto - I qualify for ${first}${tail}. Check yours at ${origin}`;
}

export default function Predictor() {
  useDocumentTitle("Admission predictor | Thuto");
  const [programmes, setProgrammes] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [shareFeedback, setShareFeedback] = useState(null);
  const resultsSectionRef = useRef(null);
  const hasAutoScrolledToResultsRef = useRef(false);
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
    canAdd,
    bgcseSubjects,
  } = usePredictorGradeInput();

  useEffect(() => {
    let cancelled = false;
    fetch("/data/programmes.json")
      .then((r) => {
        if (!r.ok) throw new Error("Could not load programmes");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setProgrammes(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    if (!programmes.length || !requirementGrades || !breakdown || breakdown.invalid) return null;
    return evaluateAllProgrammes(programmes, requirementGrades, breakdown.total);
  }, [programmes, requirementGrades, breakdown]);

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
      resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [results, summary, breakdown]);

  function handleReset() {
    clearPredictorSession();
    resetRows();
    hasAutoScrolledToResultsRef.current = false;
    setShareFeedback(null);
  }

  function scrollToGradeSection() {
    document.getElementById("predictor-grade-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleShare() {
    if (!breakdown || breakdown.invalid || !results?.length) return;
    const text = buildShareText(breakdown.total, results);
    try {
      await navigator.clipboard.writeText(text);
      setShareFeedback("Copied summary - paste into WhatsApp or notes.");
    } catch {
      setShareFeedback("Could not access clipboard. Try copying from your browser menu.");
    }
    window.setTimeout(() => setShareFeedback(null), 4000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Admission predictor</h1>
        <p className="mt-2 text-sm text-slate-600">
          Points: A=6, B=5, C=4, D=3, E=2, U=0. Your total is the sum of your <strong>best six</strong> subjects (you
          can enter up to nine). Eligibility still checks subject requirements (e.g. Maths, English Language,
          Science) using your best grade in each category.
        </p>
      </div>

      {loadError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {loadError}
        </p>
      )}

      <PredictorGradeSection
        rows={rows}
        chosenSubjectIds={chosenSubjectIds}
        validationMessage={validationMessage}
        breakdown={breakdown}
        updateRow={updateRow}
        addRow={addRow}
        removeRow={removeRow}
        canAdd={canAdd}
        subjects={bgcseSubjects}
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

      {results && summary && (
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
