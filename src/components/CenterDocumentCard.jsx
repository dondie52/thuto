import { Link } from "react-router-dom";
import { documentTypeLabel, formatFileSize } from "../lib/thutoCenter.js";

/**
 * @param {{ document: import('../lib/thutoCenter.js').normalizeDocument extends Function ? ReturnType<import('../lib/thutoCenter.js').normalizeDocument> : object, unlocked?: boolean, isPro?: boolean }} props
 */
export default function CenterDocumentCard({ document, unlocked = false, isPro = false }) {
  const canAccess = unlocked || isPro;

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
            {document.courseCode} · {document.faculty}
          </p>
          <h3 className="mt-1 font-display text-base font-semibold leading-snug text-brand-900">
            <Link to={`/center/${document.id}`} className="hover:underline">
              {document.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-stone-600">{document.universityName || document.universityId}</p>
        </div>
        {canAccess ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
            {isPro ? "Pro" : "Unlocked"}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Locked
          </span>
        )}
      </div>

      {document.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-stone-600">{document.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium">{documentTypeLabel(document.documentType)}</span>
        <span>{formatFileSize(document.fileSize)}</span>
        {document.academicYear ? <span>{document.academicYear}</span> : null}
        {document.helpfulCount > 0 ? <span>{document.helpfulCount} helpful</span> : null}
        {document.downloadCount > 0 ? <span>{document.downloadCount} downloads</span> : null}
      </div>

      <Link
        to={`/center/${document.id}`}
        className="focus-ring mt-4 inline-flex min-h-10 items-center rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-100"
      >
        {canAccess ? "Open & download" : "View details & unlock"}
      </Link>
    </article>
  );
}
