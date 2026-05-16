import { GRADE_POINTS } from "../lib/admissions.js";

const GRADE_OPTIONS = ["", ...Object.keys(GRADE_POINTS)];

/**
 * Shared grade rows + best-six summary (predictor and fit finder).
 * @param {{
 *   rows: Array<{ key: string, subjectId: string, grade: string }>,
 *   chosenSubjectIds: Set<string>,
 *   validationMessage: string | null,
 *   breakdown: { total: number, counted: Array<{ subjectId: string, label: string, grade: string, points: number }>, dropped: Array<{ subjectId: string, label: string, grade: string, points: number }>, invalid: string | null } | null,
 *   updateRow: (rowKey: string, patch: Partial<{ subjectId: string, grade: string }>) => void,
 *   addRow: () => void,
 *   removeRow: (rowKey: string) => void,
 *   canAdd: boolean,
 *   subjects: Array<{ id: string, label: string }>,
 * }} props
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
}) {
  return (
    <div id="predictor-grade-section" className="space-y-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-brand-800">Your subjects & grades</legend>
        <ul className="space-y-3">
          {rows.map((row) => (
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
                  {subjects.map((s) => (
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
              <div className="w-full sm:w-28">
                <label htmlFor={`grade-${row.key}`} className="block text-xs font-medium text-slate-600">
                  Grade
                </label>
                <select
                  id={`grade-${row.key}`}
                  value={row.grade}
                  onChange={(e) => updateRow(row.key, { grade: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g || "empty"} value={g}>
                      {g === "" ? "-" : g}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 sm:shrink-0"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addRow}
          disabled={!canAdd}
          className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add subject
        </button>
      </div>

      {validationMessage && (
        <p className="text-sm text-amber-800" role="status">
          {validationMessage}
        </p>
      )}

      {breakdown?.invalid && (
        <p className="text-sm text-red-800" role="alert">
          {breakdown.invalid}
        </p>
      )}

      {breakdown && !breakdown.invalid && breakdown.counted.length > 0 && (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-950">
          <p>
            <strong className="text-brand-900">Best-six total:</strong>{" "}
            <span className="text-lg font-bold text-brand-800">{breakdown.total}</span> pts
          </p>
          <div>
            <p className="font-medium text-brand-900">Counted toward best six</p>
            <ul className="mt-1 list-inside list-disc text-emerald-900">
              {breakdown.counted.map((e) => (
                <li key={e.subjectId}>
                  {e.label}: {e.grade} ({e.points} pts)
                </li>
              ))}
            </ul>
          </div>
          {breakdown.dropped.length > 0 && (
            <div>
              <p className="font-medium text-emerald-900">Not counted (lower grades than your top six)</p>
              <ul className="mt-1 list-inside list-disc text-emerald-800">
                {breakdown.dropped.map((e) => (
                  <li key={e.subjectId}>
                    {e.label}: {e.grade} ({e.points} pts)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
