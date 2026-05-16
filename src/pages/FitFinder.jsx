import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BGCSE_SUBJECTS } from "../lib/bgcseSubjects.js";
import { usePredictorGradeInput } from "../hooks/usePredictorGradeInput.js";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import PredictorGradeSection from "../components/PredictorGradeSection.jsx";
import ProgrammeBookmarkButton from "../components/ProgrammeBookmarkButton.jsx";
import {
  CAREER_AREA_OPTIONS,
  QUALIFICATION_LEVEL_OPTIONS,
  STUDY_MODE_OPTIONS,
  loadFitAnswersFromStorage,
  parseFitAnswers,
  rankProgrammeMatches,
  saveFitAnswersToStorage,
} from "../lib/fitFinder.js";
import { fetchProgrammes } from "../lib/programmesData.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

const STEPS = /** @type {const} */ (["grades", "profile", "results"]);

export default function FitFinder() {
  useDocumentTitle("Programme fit finder | Thuto");
  const [step, setStep] = useState(/** @type {typeof STEPS[number]} */ ("grades"));
  const [programmes, setProgrammes] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [profile, setProfile] = useState(() => loadFitAnswersFromStorage());
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

  const gradesReady = Boolean(
    !validationMessage && breakdown && !breakdown.invalid && breakdown.counted.length > 0 && requirementGrades,
  );

  const institutions = useMemo(() => {
    const set = new Set(programmes.map((p) => p.university).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [programmes]);

  const studyModes = useMemo(() => {
    const set = new Set(STUDY_MODE_OPTIONS.map((o) => o.value).filter(Boolean));
    programmes.map((p) => p.studyMode).filter(Boolean).forEach((mode) => set.add(mode));
    return ["", ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [programmes]);

  const matchProfile = useMemo(
    () => ({
      ...parseFitAnswers(profile),
      requirementGrades,
      bestSixTotal: breakdown?.total,
      subjectIds: rows.filter((row) => row.grade?.trim()).map((row) => row.subjectId),
    }),
    [profile, requirementGrades, breakdown, rows],
  );

  const ranked = useMemo(() => {
    if (!programmes.length || !gradesReady) return [];
    return rankProgrammeMatches(programmes, matchProfile, { limit: 30 });
  }, [programmes, gradesReady, matchProfile]);

  function updateProfile(key, value) {
    setProfile((prev) => {
      const next = parseFitAnswers({ ...prev, [key]: value });
      saveFitAnswersToStorage(next);
      return next;
    });
  }

  function toggleAvoidSubject(subjectLabel) {
    setProfile((prev) => {
      const current = new Set(prev.avoidSubjects || []);
      if (current.has(subjectLabel)) current.delete(subjectLabel);
      else current.add(subjectLabel);
      const next = parseFitAnswers({ ...prev, avoidSubjects: [...current] });
      saveFitAnswersToStorage(next);
      return next;
    });
  }

  function goResults() {
    saveFitAnswersToStorage(parseFitAnswers(profile));
    setStep("results");
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Programme fit finder</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-brand-900">Find programmes that may fit you</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your BGCSE or IGCSE results and preferences to rank programmes using local data, sample admission rules, and
          explainable scoring. This is guidance only - always verify with each university.
        </p>
      </header>

      <ol className="flex flex-wrap gap-2 text-xs font-medium text-slate-600" aria-label="Steps">
        {STEPS.map((s, i) => {
          const active = step === s;
          const done = (s === "grades" && step !== "grades") || (s === "profile" && step === "results");
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
              {i + 1}. {s === "grades" ? "Subjects & grades" : s === "profile" ? "Preferences" : "Ranked matches"}
            </li>
          );
        })}
      </ol>

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {loadError}
        </p>
      ) : null}

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
              onClick={() => setStep("profile")}
              className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to preferences
            </button>
            <Link to="/predictor" className="text-sm font-medium text-brand-700 underline hover:text-brand-900">
              Use the full predictor page instead
            </Link>
          </div>
        </>
      )}

      {step === "profile" && (
        <section className="space-y-5 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">Interests</span>
              <textarea
                value={profile.interests}
                onChange={(e) => updateProfile("interests", e.target.value)}
                rows={3}
                placeholder="e.g. coding, helping people, business, design, science"
                className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-600">Preferred career area</span>
              <select
                value={profile.careerArea}
                onChange={(e) => updateProfile("careerArea", e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {CAREER_AREA_OPTIONS.map((o) => (
                  <option key={o.value || "any-career"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-600">Preferred institution</span>
              <select
                value={profile.preferredInstitution}
                onChange={(e) => updateProfile("preferredInstitution", e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">Any institution</option>
                {institutions.map((institution) => (
                  <option key={institution} value={institution}>
                    {institution}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-600">Preferred qualification level</span>
              <select
                value={profile.qualificationLevel}
                onChange={(e) => updateProfile("qualificationLevel", e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {QUALIFICATION_LEVEL_OPTIONS.map((o) => (
                  <option key={o.value || "any-level"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-600">Study mode</span>
              <select
                value={profile.studyMode}
                onChange={(e) => updateProfile("studyMode", e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {studyModes.map((mode) => (
                  <option key={mode || "any-mode"} value={mode}>
                    {mode ? mode.replace(/\b\w/g, (c) => c.toUpperCase()) : "Any study mode"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">Strengths</span>
              <textarea
                value={profile.strengths}
                onChange={(e) => updateProfile("strengths", e.target.value)}
                rows={2}
                placeholder="e.g. mathematics, writing, public speaking, practical work"
                className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </label>
          </div>

          <fieldset>
            <legend className="text-xs font-medium text-slate-600">Subjects you want to avoid</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {BGCSE_SUBJECTS.map((subject) => {
                const checked = profile.avoidSubjects?.includes(subject.label);
                return (
                  <label key={subject.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand-100 px-3 py-2 text-sm text-brand-900 hover:bg-brand-50/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAvoidSubject(subject.label)}
                      className="rounded border-brand-300 text-brand-700 focus:ring-brand-500"
                    />
                    <span>{subject.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

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
              Show ranked matches
            </button>
          </div>
        </section>
      )}

      {step === "results" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <strong>How scoring works:</strong> fit percentage combines your preferences, helpful subjects, avoided
            subjects, institution and study-mode preferences, and the existing sample admission rules. It is not an
            official admission score.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("profile")}
              className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              Edit preferences
            </button>
            <button
              type="button"
              onClick={() => setStep("grades")}
              className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              Edit grades
            </button>
            <Link to="/assistant" className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50">
              Ask Assistant
            </Link>
          </div>

          <section className="space-y-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-brand-900">Ranked programme matches</h2>
              <p className="mt-1 text-sm text-slate-600">
                Showing the top {ranked.length} local matches from {programmes.length} programmes.
              </p>
            </div>
            {!ranked.length ? (
              <p className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-6 text-sm text-brand-800">
                No matches yet. Check that your grades are entered and local programme data loaded.
              </p>
            ) : (
              <ul className="space-y-3">
                {ranked.map((match) => (
                  <FitResultCard
                    key={match.programme.id}
                    match={match}
                    isBookmarked={isBookmarked(match.programme.id)}
                    onToggle={() => toggle(match.programme.id)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function FitResultCard({ match, isBookmarked, onToggle }) {
  const { programme, admission, fitScore, why, concerns, nextSteps, matchedInstitution, applyLink } = match;
  const safeApplyLink = safeExternalUrl(applyLink);
  const status = admission.status;
  const badge =
    status === "Qualified"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Close"
        ? "bg-amber-100 text-amber-900"
        : status === "Unknown"
          ? "border border-slate-200 bg-slate-50 text-slate-600"
          : "bg-slate-100 text-slate-700";

  return (
    <li className="overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm">
      <div className="flex items-stretch gap-0">
        <div className="min-w-0 flex-1 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/programmes/${programme.id}`} className="font-medium text-brand-900 hover:underline">
              {programme.name}
            </Link>
            <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-semibold text-white">
              {fitScore}% fit
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}>
              {status === "Unknown" ? "Admission unverified" : status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{matchedInstitution}</p>

          <div className="mt-3 grid gap-3 text-xs leading-relaxed text-slate-700 sm:grid-cols-2">
            <InfoList title="Why it matches" items={why} empty="Matched by available local data." />
            <InfoList title="Possible concerns" items={concerns} empty="No major concerns found in local data." />
            <InfoList title="Recommended next steps" items={nextSteps} empty="Verify with the institution." />
            <div>
              <p className="font-semibold text-slate-800">Admission status</p>
              <p className="mt-1">
                {admission.status}
                {admission.reason ? ` - ${admission.reason}` : ""}
              </p>
              {safeApplyLink ? (
                <a
                  href={safeApplyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex font-semibold text-brand-700 underline"
                >
                  Open apply link
                </a>
              ) : (
                <span className="mt-2 inline-flex text-slate-500">Apply link not listed in Thuto</span>
              )}
            </div>
          </div>
        </div>
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

function InfoList({ title, items, empty }) {
  const visible = (items || []).slice(0, 3);
  return (
    <div>
      <p className="font-semibold text-slate-800">{title}</p>
      {visible.length ? (
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          {visible.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-slate-500">{empty}</p>
      )}
    </div>
  );
}
