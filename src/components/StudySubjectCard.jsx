import { Link } from "react-router-dom";

/**
 * @param {{
 *   subjectId: string,
 *   label: string,
 *   requirementKey?: string | null,
 *   programmeCount?: number,
 * }} props
 */
export default function StudySubjectCard({ subjectId, label, requirementKey, programmeCount = 0 }) {
  return (
    <Link
      to={`/study/${subjectId}`}
      className="focus-ring group flex flex-col rounded-2xl border border-brand-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <h3 className="font-display text-base font-semibold text-brand-900 group-hover:text-brand-800">{label}</h3>
      <p className="mt-1 text-xs text-slate-500">
        {requirementKey && programmeCount > 0
          ? `${programmeCount} programme${programmeCount === 1 ? "" : "s"} list this subject`
          : "Revision links and study tips"}
      </p>
      <span className="mt-3 text-xs font-semibold text-brand-700">Open subject →</span>
    </Link>
  );
}
