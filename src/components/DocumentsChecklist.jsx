import { getDocumentsChecklist } from "../lib/documentChecklists.js";

/**
 * @param {{ programme: import('../lib/programmesData.js').Programme, className?: string }} props
 */
export default function DocumentsChecklist({ programme, className = "" }) {
  const items = getDocumentsChecklist(programme);

  return (
    <section
      className={["rounded-2xl border border-brand-200 bg-white p-5 shadow-sm", className].filter(Boolean).join(" ")}
    >
      <h2 className="font-display text-lg font-semibold text-brand-900">Application documents checklist</h2>
      <p className="mt-1 text-sm text-slate-600">
        Confirm exact requirements with {programme.university || "the institution"} before you submit.
      </p>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-brand-300 text-brand-700" readOnly />
            <span>
              {item.label}
              {item.required ? (
                <span className="ml-1 text-xs font-semibold text-amber-800">(usually required)</span>
              ) : (
                <span className="ml-1 text-xs text-slate-500">(if applicable)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
