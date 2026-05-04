import { Link } from "react-router-dom";
import { compareSelectionHref } from "../lib/compareSelection.js";

/**
 * @param {{ ids: string[], onClear?: () => void, className?: string }} props
 */
export default function CompareSelectionBar({ ids, onClear, className = "" }) {
  if (!ids.length) return null;

  const href = compareSelectionHref(ids);
  const canCompare = href != null;

  return (
    <div
      className={[
        "fixed bottom-0 left-0 right-0 z-30 border-t border-brand-200 bg-white/98 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur sm:bottom-[env(safe-area-inset-bottom)]",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom)+4.5rem)] sm:pb-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="region"
      aria-label="Compare selection"
    >
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-brand-900">{ids.length}</span> selected
          {ids.length < 2 ? <span className="text-slate-500"> - pick at least 2 to compare</span> : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="text-sm font-medium text-slate-600 underline hover:text-brand-900"
            >
              Clear
            </button>
          ) : null}
          {canCompare ? (
            <Link
              to={href}
              className="inline-flex rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
            >
              Compare now
            </Link>
          ) : (
            <span className="inline-flex rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">
              Compare (need 2+)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
