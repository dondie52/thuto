import { getCareerSalaryEstimate } from "../lib/careerSalaries.js";

/**
 * @param {{
 *   careers: string[],
 *   maxCareers: number,
 *   showSalary?: boolean,
 *   empty?: string,
 *   className?: string,
 * }} props
 */
export default function CareersList({ careers, maxCareers, showSalary = false, empty, className = "" }) {
  const visible = careers.slice(0, maxCareers);
  const hiddenCount = Math.max(0, careers.length - visible.length);

  if (!visible.length) {
    return empty ? <p className={`text-sm text-slate-500 ${className}`}>{empty}</p> : null;
  }

  return (
    <div className={className}>
      <ul className="flex flex-wrap gap-2">
        {visible.map((career) => (
          <li
            key={career}
            className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-900"
            title={showSalary ? `Indicative salary: ${getCareerSalaryEstimate(career)}` : undefined}
          >
            {career}
            {showSalary ? (
              <span className="ml-1 font-normal text-brand-700/90">· {getCareerSalaryEstimate(career)}</span>
            ) : null}
          </li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          +{hiddenCount} more career{hiddenCount === 1 ? "" : "s"} on Thuto Pro
        </p>
      ) : null}
    </div>
  );
}
