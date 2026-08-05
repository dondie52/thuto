import { SCIENCE_DOUBLE_SUBJECT_ID } from "../lib/bgcseSubjects.js";

/**
 * Shared grade rows + aggregate summary (predictor and fit finder).
 */
export default function PredictorGradeSection({
  rows,
  chosenSubjectIds,
  validationMessage,
  breakdown,
  updateRow,
  addRow,
  removeRow,
  canAdd,
  subjects,
  gradeOptions = ["A*", "A", "B", "C", "D", "E", "F", "G", "U"],
  // Numeric scales need their meaning spelled out — a bare "5" is ambiguous on NSC (good),
  // ECZ (mid) and WASSCE (credit) alike.
  gradeChoices = null,
  helpText = "Thuto updates points as soon as each subject has a grade.",
  allowScienceDouble = true,
}) {
  const choices = gradeChoices?.length
    ? gradeChoices.map((choice) => ({ value: choice.value, label: choice.label || choice.value }))
    : gradeOptions.map((value) => ({ value, label: value }));
  const options = [{ value: "", label: "-" }, ...choices];
  return (
    <div id="predictor-grade-section" className="space-y-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-brand-800">Add your subjects and grades</legend>
        <p className="text-sm text-slate-600">
          {helpText}
          {allowScienceDouble ? " Science Double Award uses two component grades (e.g. CC = 12 pts)." : ""}
        </p>
        <ul className="space-y-3">
          {rows.map((row) => {
            const isDoubleAward = allowScienceDouble && row.subjectId === SCIENCE_DOUBLE_SUBJECT_ID;
            return (
              <li
                key={row.key}
                className="flex flex-col gap-2 rounded-lg border border-brand-100 bg-brand-50/40 p-3 sm:flex-row sm:flex-wrap sm:items-end"
              >
                <div className="min-w-0 flex-1 sm:max-w-md">
                  <label htmlFor={`subj-${row.key}`} className="block text-xs font-medium text-slate-600">
                    Subject
                  </label>
                  <select
                    id={`subj-${row.key}`}
                    value={row.subjectId}
                    onChange={(e) => updateRow(row.key, { subjectId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    <option value="">Select subject…</option>
                    {subjects
                      .filter((s) => allowScienceDouble || s.id !== SCIENCE_DOUBLE_SUBJECT_ID)
                      .map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={Boolean(s.id && chosenSubjectIds.has(s.id) && row.subjectId !== s.id)}
                        >
                          {s.label}
                        </option>
                      ))}
                  </select>
                </div>
                {isDoubleAward ? (
                  <>
                    <div className="w-full sm:w-56">
                      <label htmlFor={`grade1-${row.key}`} className="block text-xs font-medium text-slate-600">
                        Component 1
                      </label>
                      <select
                        id={`grade1-${row.key}`}
                        value={row.grade}
                        onChange={(e) => updateRow(row.key, { grade: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      >
                        {options.map((g) => (
                          <option key={g.value || "empty"} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-56">
                      <label htmlFor={`grade2-${row.key}`} className="block text-xs font-medium text-slate-600">
                        Component 2
                      </label>
                      <select
                        id={`grade2-${row.key}`}
                        value={row.grade2 || ""}
                        onChange={(e) => updateRow(row.key, { grade2: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      >
                        {options.map((g) => (
                          <option key={`g2-${g.value || "empty"}`} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="w-full sm:w-56">
                    <label htmlFor={`grade-${row.key}`} className="block text-xs font-medium text-slate-600">
                      Grade
                    </label>
                    <select
                      id={`grade-${row.key}`}
                      value={row.grade}
                      onChange={(e) => updateRow(row.key, { grade: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    >
                      {options.map((g) => (
                        <option key={g.value || "empty"} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 sm:shrink-0"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          disabled={!canAdd}
          className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add another subject
        </button>
      </div>

      {validationMessage ? (
        <p className="text-sm text-amber-800" role="status">
          {validationMessage}
        </p>
      ) : null}

      {breakdown?.invalid ? (
        <p className="text-sm text-red-800" role="alert">
          {breakdown.invalid}
        </p>
      ) : null}

      {breakdown && !breakdown.invalid && breakdown.counted.length > 0 ? (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-950">
          <p>
            <strong className="text-brand-900">{breakdown.aggregateLabel || "Best-six total"}:</strong>{" "}
            <span className="text-lg font-bold text-brand-800">{breakdown.total}</span>
            {breakdown.aggregateLabel?.includes("APS") ? "" : " pts"}
          </p>
          {breakdown.syllabusType && breakdown.syllabusType !== "bgcse" ? (
            <p className="text-xs text-emerald-900/90">
              About <strong>{breakdown.bgcseEquivalent}/48</strong> on the BGCSE scale Thuto&apos;s minimum points
              are published against. Conversions are guidance only.
            </p>
          ) : null}
          <div>
            <p className="font-medium text-brand-900">Counted toward total</p>
            <ul className="mt-1 list-inside list-disc text-emerald-900">
              {breakdown.counted.map((e) => (
                <li key={e.subjectId}>
                  {e.label}: {e.grade} ({e.points}
                  {breakdown.aggregateLabel?.includes("APS") ? "" : " pts"})
                </li>
              ))}
            </ul>
          </div>
          {breakdown.dropped.length > 0 ? (
            <div>
              <p className="font-medium text-emerald-900">Not counted (lower than your top six)</p>
              <ul className="mt-1 list-inside list-disc text-emerald-800">
                {breakdown.dropped.map((e) => (
                  <li key={e.subjectId}>
                    {e.label}: {e.grade} ({e.points})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
