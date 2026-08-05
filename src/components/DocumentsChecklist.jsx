import { Link } from "react-router-dom";
import { getApplicationDocuments } from "../lib/applicationDocuments.js";
import { getEntryPlanPriceText } from "../lib/premium.js";

/**
 * The box is always visible so students can see the checklist exists; on the free tier the
 * document labels are masked and the upgrade nudge sits inside the card rather than replacing it.
 *
 * @param {{
 *   programme: Record<string, unknown>,
 *   locked?: boolean,
 *   uploads?: { key: string, label: string, fileName?: string }[],
 *   renderUpload?: (doc: { id: string, label: string, note?: string }) => import('react').ReactNode,
 * }} props
 */
export default function DocumentsChecklist({ programme, locked = false, uploads = [], renderUpload = null }) {
  const documents = getApplicationDocuments(programme);
  const uploadByKey = new Map(uploads.map((item) => [item.key, item]));

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-brand-900">Application documents checklist</h2>
          <p className="mt-1 text-sm text-slate-600">
            Documents you typically need when applying. Always confirm the latest list with{" "}
            {programme.university || "the institution"}.
          </p>
        </div>
        {locked ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Pro
          </span>
        ) : null}
      </div>

      <ul className="mt-4 space-y-3" aria-hidden={locked ? "true" : undefined}>
        {documents.map((doc) => {
          const upload = uploadByKey.get(doc.id);
          return (
            <li key={doc.id} className="flex gap-3 rounded-xl border border-brand-100 bg-brand-50/40 px-3 py-3">
              <span
                className={[
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                  upload
                    ? "border-emerald-400 bg-emerald-500 text-white"
                    : "border-brand-300 bg-white text-brand-700",
                ].join(" ")}
              >
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={[
                    "text-sm font-semibold text-brand-900",
                    locked && "select-none blur-[5px]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {doc.label}
                </p>
                {doc.note ? (
                  <p
                    className={[
                      "mt-0.5 text-xs text-slate-600",
                      locked && "select-none blur-[5px]",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {doc.note}
                  </p>
                ) : null}
                {!locked && upload?.fileName ? (
                  <p className="mt-1 truncate text-xs font-medium text-emerald-800">{upload.fileName}</p>
                ) : null}
                {!locked && renderUpload ? <div className="mt-2">{renderUpload(doc)}</div> : null}
              </div>
            </li>
          );
        })}
      </ul>

      {locked ? (
        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3">
          <p className="text-sm text-brand-900">
            Upgrade to Pro for {getEntryPlanPriceText()} to view the full document checklist for this programme and
            tick items off as you collect them.
          </p>
          <Link
            to="/upgrade"
            className="focus-ring mt-2 inline-flex rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
          >
            See Pro plans
          </Link>
        </div>
      ) : null}
    </section>
  );
}
