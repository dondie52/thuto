import { getApplicationDocuments } from "../lib/applicationDocuments.js";

/**
 * @param {{ programme: Record<string, unknown> }} props
 */
export default function DocumentsChecklist({ programme }) {
  const documents = getApplicationDocuments(programme);

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-brand-900">Application documents checklist</h2>
      <p className="mt-1 text-sm text-slate-600">
        Documents you typically need when applying. Always confirm the latest list with {programme.university || "the institution"}.
      </p>
      <ul className="mt-4 space-y-3">
        {documents.map((doc) => (
          <li key={doc.id} className="flex gap-3 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-brand-300 bg-white text-[10px] font-bold text-brand-700">
              ✓
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-900">{doc.label}</p>
              {doc.note ? <p className="mt-0.5 text-xs text-slate-600">{doc.note}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
