import ExternalSiteLink from "./ExternalSiteLink.jsx";
import { STUDENT_INCENTIVE_CATEGORY_META, normalizeStudentIncentives } from "../lib/studentIncentives.js";
import { isAllowedExternalResourceUrl, safeExternalUrl } from "../lib/urlSafety.js";

/**
 * @param {{ university: { name?: string, studentIncentives?: unknown } }} props
 */
export default function UniversityStudentIncentives({ university }) {
  const items = normalizeStudentIncentives(university?.studentIncentives);
  if (!items.length) return null;

  const categories = [...new Set(items.map((item) => item.category))];

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm" aria-labelledby="student-incentives-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="student-incentives-heading" className="font-display text-lg font-semibold text-brand-900">
            Student incentives
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Offers for new students such as accommodation, devices, discounts, and bursaries — from official sources.
          </p>
        </div>
        <p className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
          {items.length} {items.length === 1 ? "offer" : "offers"}
        </p>
      </div>

      {categories.length ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Incentive categories">
          {categories.map((category) => {
            const meta = STUDENT_INCENTIVE_CATEGORY_META[category];
            return (
              <span
                key={category}
                className="rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold text-brand-800"
              >
                <span aria-hidden="true">{meta.icon} </span>
                {meta.label}
              </span>
            );
          })}
        </div>
      ) : null}

      <ul className="mt-4 grid gap-3">
        {items.map((item) => {
          const meta = STUDENT_INCENTIVE_CATEGORY_META[item.category];
          const sourceHref = isAllowedExternalResourceUrl(item.sourceUrl) ? safeExternalUrl(item.sourceUrl) : "";
          return (
            <li
              key={`${item.category}-${item.label}`}
              className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 text-sm"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg" aria-hidden="true">
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-900">{item.label}</p>
                  {item.detail ? <p className="mt-1 leading-relaxed text-slate-600">{item.detail}</p> : null}
                  {sourceHref ? (
                    <ExternalSiteLink
                      href={sourceHref}
                      variant="inline"
                      institutionName={university?.name}
                      className="mt-2 inline-flex text-xs font-semibold"
                    >
                      {item.sourceLabel ? `Source: ${item.sourceLabel}` : "View official source"}
                    </ExternalSiteLink>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Offers change by intake — confirm with {university?.name || "the institution"} before you apply.
      </p>
    </section>
  );
}
