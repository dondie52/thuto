import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePredictorGradeInput } from "../hooks/usePredictorGradeInput.js";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import PredictorGradeSection from "../components/PredictorGradeSection.jsx";
import ProgrammeBookmarkButton from "../components/ProgrammeBookmarkButton.jsx";
import {
  FIT_FINDER_QUESTIONS,
  loadFitAnswersFromStorage,
  saveFitAnswersToStorage,
  rankProgrammesForFit,
  parseFitAnswers,
} from "../lib/fitFinder.js";

const STEPS = /** @type {const} */ (["grades", "quiz", "results"]);

export default function FitFinder() {
  useDocumentTitle("Programme fit finder | Thuto");
  const [step, setStep] = useState(/** @type {typeof STEPS[number]} */ ("grades"));
  const [programmes, setProgrammes] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [answers, setAnswers] = useState(() => loadFitAnswersFromStorage());
  const { toggle, isBookmarked } = useBookmarks();

  const {
    rows,
    chosenSubjectIds,
    validationMessage,
    breakdown,
    requirementGrades,
    updateRow,
    addRow,
    removeRow,
    canAdd,
    bgcseSubjects,
  } = usePredictorGradeInput();

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/programmes.json`)
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

  const gradesReady = Boolean(
    !validationMessage && breakdown && !breakdown.invalid && breakdown.counted.length > 0 && requirementGrades,
  );

  const ranked = useMemo(() => {
    if (!programmes.length || !requirementGrades || !breakdown || breakdown.invalid) return [];
    return rankProgrammesForFit(programmes, requirementGrades, breakdown.total, answers);
  }, [programmes, requirementGrades, breakdown, answers]);

  const grouped = useMemo(() => {
    const strong = [];
    const worth = [];
    const stretch = [];
    for (const row of ranked) {
      if (row.bucket === "strong") strong.push(row);
      else if (row.bucket === "worth") worth.push(row);
      else stretch.push(row);
    }
    return { strong, worth, stretch };
  }, [ranked]);

  function setAnswer(/** @type {string} */ key, /** @type {string} */ value) {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      saveFitAnswersToStorage(next);
      return next;
    });
  }

  function goResults() {
    saveFitAnswersToStorage(parseFitAnswers(answers));
    setStep("results");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Programme fit finder</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-brand-900">Find programmes that may fit you</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your BGCSE results, answer a few preference questions, and see <strong>rough</strong> groupings: strong
          matches, worth considering, and stretch ideas. This is guidance only - always verify with each university.
        </p>
      </div>

      <ol className="flex flex-wrap gap-2 text-xs font-medium text-slate-600" aria-label="Steps">
        {STEPS.map((s, i) => {
          const active = step === s;
          const done =
            (s === "grades" && step !== "grades") || (s === "quiz" && step === "results");
          return (
            <li
              key={s}
              className={[
                "rounded-full px-3 py-1",
                active && "bg-brand-700 text-white",
                !active && done && "bg-emerald-100 text-emerald-900",
                !active && !done && "bg-brand-100 text-brand-800",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {i + 1}. {s === "grades" ? "Your grades" : s === "quiz" ? "Your interests" : "Results"}
            </li>
          );
        })}
      </ol>

      {loadError && step === "results" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {loadError}
        </p>
      )}

      {step === "grades" && (
        <>
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
              disabled={!gradesReady}
              onClick={() => setStep("quiz")}
              className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to interests
            </button>
            <Link to="/predictor" className="text-sm font-medium text-brand-700 underline hover:text-brand-900">
              Use the full predictor page instead
            </Link>
          </div>
        </>
      )}

      {step === "quiz" && (
        <div className="space-y-6">
          {FIT_FINDER_QUESTIONS.map((q) => (
            <fieldset key={q.id} className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
              <legend className="font-display text-base font-semibold text-brand-900">{q.title}</legend>
              {q.subtitle ? <p className="mt-1 text-xs text-slate-500">{q.subtitle}</p> : null}
              <ul className="mt-3 space-y-2">
                {q.options.map((opt) => {
                  const id = `${q.id}-${opt.value}`;
                  const checked = answers[q.id] === opt.value;
                  return (
                    <li key={opt.value}>
                      <label
                        htmlFor={id}
                        className={[
                          "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                          checked ? "border-brand-500 bg-brand-50 ring-1 ring-brand-400" : "border-brand-100 hover:bg-brand-50/60",
                        ].join(" ")}
                      >
                        <input
                          id={id}
                          type="radio"
                          name={q.id}
                          value={opt.value}
                          checked={checked}
                          onChange={() => setAnswer(q.id, opt.value)}
                          className="mt-1 border-brand-300 text-brand-700 focus:ring-brand-500"
                        />
                        <span className="text-slate-800">{opt.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ))}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("grades")}
              className="rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goResults}
              disabled={!gradesReady}
              className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              See my matches
            </button>
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <strong>How scoring works:</strong> your eligibility (points + subject requirements), how your answers line
            up with each field/career list, and a small boost when your grades clearly exceed a programme&apos;s subject
            bars. Scores are for sorting inside Thuto - not official admission scores.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("quiz")}
              className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              Edit answers
            </button>
            <button
              type="button"
              onClick={() => setStep("grades")}
              className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              Edit grades
            </button>
            <Link to="/saved" className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50">
              Saved programmes
            </Link>
          </div>

          <FitSection
            title="Strong matches"
            subtitle="You may qualify on points and requirements, with decent alignment to what you said you enjoy."
            items={grouped.strong}
            isBookmarked={isBookmarked}
            onToggle={toggle}
            empty="No programmes landed here yet - try adjusting your interest answers or check the Worth considering list."
          />
          <FitSection
            title="Worth considering"
            subtitle="Close on points, lower interest fit, or subject gaps worth discussing with a teacher or the university."
            items={grouped.worth}
            isBookmarked={isBookmarked}
            onToggle={toggle}
            empty="Nothing in this band - broaden your career curiosity choice or add more grades."
          />
          <FitSection
            title="Stretch ideas"
            subtitle="High interest but tougher on points or requirements - useful if you are planning to improve results or explore alternatives."
            items={grouped.stretch}
            isBookmarked={isBookmarked}
            onToggle={toggle}
            empty="No stretch picks - your strongest alignments may already sit in the other groups."
          />
        </div>
      )}
    </div>
  );
}

function FitSection({ title, subtitle, items, isBookmarked, onToggle, empty }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-semibold text-brand-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>
      {!items.length ? (
        <p className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-6 text-sm text-slate-600">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map(({ programme, evaluation, interestScore, scoreBreakdown, subjectFail }) => (
            <FitResultCard
              key={programme.id}
              programme={programme}
              evaluation={evaluation}
              interestScore={interestScore}
              scoreBreakdown={scoreBreakdown}
              subjectFail={subjectFail}
              isBookmarked={isBookmarked(programme.id)}
              onToggle={() => onToggle(programme.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * @param {{
 *   programme: object,
 *   evaluation: { status: string, reason: string | null, total: number },
 *   interestScore: number,
 *   scoreBreakdown: { quiz: number, careers: number, grades: number },
 *   subjectFail: boolean,
 *   isBookmarked: boolean,
 *   onToggle: () => void,
 * }} props
 */
function FitResultCard({ programme, evaluation, interestScore, scoreBreakdown, subjectFail, isBookmarked, onToggle }) {
  const status = evaluation.status;
  const badge =
    status === "Qualified"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Close"
        ? "bg-amber-100 text-amber-900"
        : status === "Unknown"
          ? "border border-slate-200 bg-slate-50 text-slate-600"
          : "bg-slate-100 text-slate-700";
  const statusLabel = status === "Unknown" ? "Unverified" : status;

  return (
    <li className="overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm">
      <div className="flex items-stretch gap-0">
        <Link
          to={`/programmes/${programme.id}`}
          className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3 transition hover:bg-brand-50"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-brand-900">{programme.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}>{statusLabel}</span>
          </div>
          <span className="text-xs text-slate-500">{programme.university}</span>
          <span className="text-xs text-slate-600">
            Fit score: <strong>{interestScore}</strong> / 100 · Quiz {scoreBreakdown.quiz} + careers {scoreBreakdown.careers}{" "}
            + grades {scoreBreakdown.grades}
          </span>
          <span className="text-xs text-slate-600">
            Your best-six: <strong>{evaluation.total}</strong>
            {typeof programme.minPoints === "number" && Number.isFinite(programme.minPoints) ? (
              <>
                {" "}
                vs min <strong>{programme.minPoints}</strong>
              </>
            ) : (
              <> · min pts not listed in Thuto</>
            )}
            {subjectFail ? " · Check subject requirements" : ""}
          </span>
          {evaluation.reason ? <span className="text-xs text-slate-600">{evaluation.reason}</span> : null}
        </Link>
        <div className="flex items-center border-l border-brand-100 pr-2">
          <ProgrammeBookmarkButton
            programmeId={programme.id}
            programmeName={programme.name}
            pressed={isBookmarked}
            onToggle={onToggle}
          />
        </div>
      </div>
    </li>
  );
}
