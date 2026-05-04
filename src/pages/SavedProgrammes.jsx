import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { useCompareSelection } from "../hooks/useCompareSelection.js";
import { compareSelectionHref } from "../lib/compareSelection.js";
import ProgrammeBookmarkButton from "../components/ProgrammeBookmarkButton.jsx";
import CompareSelectionBar from "../components/CompareSelectionBar.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

function compareHrefFirstSaved(ids) {
  const slice = ids.slice(0, 3);
  if (slice.length < 2) return null;
  return `/compare?ids=${encodeURIComponent(slice.join(","))}`;
}

export default function SavedProgrammes() {
  useDocumentTitle("Saved programmes | Thuto");
  const { ids, toggle, isBookmarked } = useBookmarks();
  const { ids: compareIds, toggle: toggleCompare, clear: clearCompare, isSelected, canAdd } = useCompareSelection();
  const [programmes, setProgrammes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/programmes.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load programmes");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setProgrammes(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(() => {
    const m = new Map();
    for (const p of programmes) m.set(p.id, p);
    return m;
  }, [programmes]);

  const explicitCompareHref = compareSelectionHref(compareIds);
  const fallbackCompareHref = compareIds.length === 0 ? compareHrefFirstSaved(ids) : null;

  return (
    <div className={`space-y-6 ${compareIds.length > 0 ? "pb-28 sm:pb-8" : ""}`}>
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Saved programmes</h1>
        <p className="mt-2 text-sm text-slate-600">
          Shortlist up to 10 programmes. They stay on this device only (localStorage). Tick programmes to build a
          compare list (up to 3), or use the quick compare shortcut below.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {explicitCompareHref ? (
        <Link
          to={explicitCompareHref}
          className="inline-flex rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
        >
          Compare selected ({compareIds.length})
        </Link>
      ) : null}

      {!explicitCompareHref && fallbackCompareHref ? (
        <Link
          to={fallbackCompareHref}
          className="inline-flex rounded-xl border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm hover:bg-brand-50"
        >
          Quick compare first 3 saved (in save order)
        </Link>
      ) : null}

      {!ids.length && !error ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-10 text-center">
          <p className="font-medium text-brand-900">No saved programmes yet</p>
          <p className="mt-2 text-sm text-slate-600">Browse programmes and tap the bookmark icon to shortlist.</p>
          <Link
            to="/programmes"
            className="mt-4 inline-block text-sm font-semibold text-brand-700 underline hover:text-brand-900"
          >
            Browse programmes
          </Link>
        </div>
      ) : null}

      {ids.length > 0 ? (
        <ul className="divide-y divide-brand-100 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm">
          {ids.map((id) => {
            const p = byId.get(id);
            if (!p) {
              return (
                <li key={id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-slate-500">
                  <span>Unknown programme ({id})</span>
                  <ProgrammeBookmarkButton programmeId={id} pressed={isBookmarked(id)} onToggle={() => toggle(id)} />
                </li>
              );
            }
            const compareDisabled = !isSelected(p.id) && !canAdd;
            return (
              <li key={id}>
                <div className="flex items-stretch gap-0">
                  <div className="flex shrink-0 items-center border-r border-brand-100 px-2">
                    <label
                      className={`flex items-center p-1 ${compareDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-brand-300 text-brand-700 focus:ring-brand-500"
                        checked={isSelected(p.id)}
                        disabled={compareDisabled}
                        onChange={() => toggleCompare(p.id)}
                        aria-label={`Select ${p.name} for compare`}
                        title={compareDisabled ? "Compare allows at most 3 programmes" : undefined}
                      />
                    </label>
                  </div>
                  <Link
                    to={`/programmes/${p.id}`}
                    className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3 transition hover:bg-brand-50"
                  >
                    <span className="font-medium text-brand-900">{p.name}</span>
                    <span className="text-xs text-slate-500">
                      {p.university}
                      {p.field ? ` · ${p.field}` : ""}
                    </span>
                    <span className="mt-1 text-xs font-medium text-brand-700">
                      {typeof p.minPoints === "number" && Number.isFinite(p.minPoints)
                        ? `Min ${p.minPoints} pts`
                        : "Min pts not listed"}{" "}
                      →
                    </span>
                  </Link>
                  <div className="flex items-center pr-2">
                    <ProgrammeBookmarkButton
                      programmeId={p.id}
                      programmeName={p.name}
                      pressed={isBookmarked(p.id)}
                      onToggle={() => toggle(p.id)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {compareIds.length > 0 ? <CompareSelectionBar ids={compareIds} onClear={clearCompare} /> : null}
    </div>
  );
}
