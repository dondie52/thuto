import { Link } from "react-router-dom";

/**
 * @param {{
 *   focusSubjects: Array<{
 *     requirementKey: string,
 *     label: string,
 *     grade: string,
 *     gatedProgrammeCount: number,
 *     unlockCount: number,
 *     studySubjectId: string | null,
 *   }>,
 * }} props
 */
export default function StudyFocusBanner({ focusSubjects }) {
  if (!focusSubjects?.length) return null;

  const primary = focusSubjects[0];

  return (
    <section
      className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100/40 p-4 shadow-sm sm:p-5"
      aria-labelledby="study-focus-heading"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">From your Predictor grades</p>
      <h2 id="study-focus-heading" className="mt-1 font-display text-lg font-semibold text-brand-900">
        Focus subjects that unlock programmes
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Your {primary.label} is {primary.grade}
        {primary.unlockCount > 0
          ? ` — improving by one grade step may unlock ${primary.unlockCount} more programme${primary.unlockCount === 1 ? "" : "s"}.`
          : primary.gatedProgrammeCount > 0
            ? ` — ${primary.gatedProgrammeCount} programme${primary.gatedProgrammeCount === 1 ? "" : "s"} list a higher grade for this subject.`
            : "."}
      </p>
      <ul className="mt-3 space-y-2">
        {focusSubjects.map((row) => (
          <li key={row.requirementKey} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-100 bg-white/80 px-3 py-2 text-sm">
            <span className="font-medium text-stone-800">
              {row.label} <span className="text-slate-500">({row.grade})</span>
            </span>
            {row.studySubjectId ? (
              <Link to={`/study/${row.studySubjectId}`} className="font-semibold text-brand-800 underline">
                Revise →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
      <Link to="/predictor" className="mt-3 inline-flex text-sm font-semibold text-brand-800 underline">
        Update grades in Predictor
      </Link>
    </section>
  );
}
