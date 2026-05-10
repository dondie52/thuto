import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import {
  evaluateAllProgrammes,
  programmeHasAdmissionPoints,
  readPredictorSession,
} from "../lib/admissions.js";
import { useBookmarks } from "../hooks/useBookmarks.js";
import { useCompareSelection } from "../hooks/useCompareSelection.js";
import ProgrammeBookmarkButton from "../components/ProgrammeBookmarkButton.jsx";
import EligibilityPill from "../components/EligibilityPill.jsx";
import CompareSelectionBar from "../components/CompareSelectionBar.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { fetchProgrammes } from "../lib/programmesData.js";

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "points_asc", label: "Min points (low → high)" },
  { value: "points_desc", label: "Min points (high → low)" },
];

function patchSearchParams(prev, patch) {
  const next = new URLSearchParams(prev);
  for (const [key, value] of Object.entries(patch)) {
    if (value === "" || value === null || value === undefined) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }
  if (next.get("sort") === "name_asc") next.delete("sort");
  if (next.get("uni") === "All" || !next.get("uni")) next.delete("uni");
  if (next.get("field") === "All" || !next.get("field")) next.delete("field");
  if (next.get("qualify") !== "1") next.delete("qualify");
  return next;
}

export default function Programmes() {
  useDocumentTitle("Programmes | Thuto");
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [programmes, setProgrammes] = useState([]);
  const [error, setError] = useState(null);
  const { toggle, isBookmarked } = useBookmarks();
  const { ids: compareIds, toggle: toggleCompare, clear: clearCompare, isSelected, canAdd } = useCompareSelection();

  const predTotal = readPredictorSession().total;

  const eligibilityById = useMemo(() => {
    if (!programmes.length) return new Map();
    const snap = readPredictorSession();
    if (snap.grades == null || snap.total == null) return new Map();
    const results = evaluateAllProgrammes(programmes, snap.grades, snap.total);
    const m = new Map();
    for (const r of results) {
      m.set(r.programme.id, { status: r.status, reason: r.reason, total: r.total });
    }
    return m;
  }, [programmes]);

  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const uni = searchParams.get("uni") ?? "All";
  const uniId = searchParams.get("uniId") ?? "";
  const field = searchParams.get("field") ?? "All";
  const minPtsRaw = searchParams.get("minPts") ?? "";
  const maxPtsRaw = searchParams.get("maxPts") ?? "";
  const sort = searchParams.get("sort") ?? "name_asc";
  const qualifyPoints = searchParams.get("qualify") === "1";

  const minPts = minPtsRaw === "" ? null : Number(minPtsRaw);
  const maxPts = maxPtsRaw === "" ? null : Number(maxPtsRaw);
  const minPtsValid = minPtsRaw !== "" && Number.isFinite(minPts);
  const maxPtsValid = maxPtsRaw !== "" && Number.isFinite(maxPts);

  const setPatch = useCallback(
    (patch) => {
      setSearchParams((prev) => patchSearchParams(prev, patch), { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    let cancelled = false;
    fetchProgrammes()
      .then((data) => {
        if (!cancelled) setProgrammes(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const universities = useMemo(() => {
    const set = new Set(programmes.map((p) => p.university).filter(Boolean));
    return ["All", ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [programmes]);

  useEffect(() => {
    if (!programmes.length || !uniId || uni !== "All") return;
    const match = programmes.find((p) => String(p.universityShort || "").toLowerCase() === uniId.toLowerCase());
    if (match?.university) {
      setPatch({ uni: match.university, uniId: "" });
    }
  }, [programmes, uniId, uni, setPatch]);

  const fields = useMemo(() => {
    const set = new Set(programmes.map((p) => p.field).filter(Boolean));
    return ["All", ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [programmes]);

  const filteredSorted = useMemo(() => {
    let list = programmes.slice();

    if (q) {
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.university && p.university.toLowerCase().includes(q)),
      );
    }
    if (uni !== "All") list = list.filter((p) => p.university === uni);
    if (field !== "All") list = list.filter((p) => p.field === field);
    if (minPtsValid) list = list.filter((p) => programmeHasAdmissionPoints(p) && p.minPoints >= minPts);
    if (maxPtsValid) list = list.filter((p) => programmeHasAdmissionPoints(p) && p.minPoints <= maxPts);
    if (qualifyPoints && predTotal != null) {
      list = list.filter((p) => programmeHasAdmissionPoints(p) && p.minPoints <= predTotal);
    }

    const sorted = [...list];
    if (sort === "name_desc") sorted.sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === "points_asc") {
      sorted.sort((a, b) => {
        const aHas = programmeHasAdmissionPoints(a);
        const bHas = programmeHasAdmissionPoints(b);
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        if (!aHas && !bHas) return a.name.localeCompare(b.name);
        return a.minPoints - b.minPoints;
      });
    } else if (sort === "points_desc") {
      sorted.sort((a, b) => {
        const aHas = programmeHasAdmissionPoints(a);
        const bHas = programmeHasAdmissionPoints(b);
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        if (!aHas && !bHas) return a.name.localeCompare(b.name);
        return b.minPoints - a.minPoints;
      });
    } else sorted.sort((a, b) => a.name.localeCompare(b.name));

    return sorted;
  }, [programmes, q, uni, field, minPts, maxPts, minPtsValid, maxPtsValid, sort, qualifyPoints, predTotal]);

  const hasActiveFilters =
    (searchParams.get("q") ?? "").trim() !== "" ||
    (searchParams.get("uni") && searchParams.get("uni") !== "All") ||
    (searchParams.get("field") && searchParams.get("field") !== "All") ||
    (searchParams.get("minPts") ?? "") !== "" ||
    (searchParams.get("maxPts") ?? "") !== "" ||
    sort !== "name_asc" ||
    qualifyPoints;

  function clearFilters() {
    setSearchParams({}, { replace: true });
  }

  return (
    <div className={`space-y-6 ${compareIds.length > 0 ? "pb-28 sm:pb-8" : ""}`}>
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Programmes</h1>
        <p className="mt-2 text-sm text-slate-600">Search and filter - open a programme for detail. Filters stay in the URL so the back button restores your list.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="prog-search" className="block text-xs font-medium text-slate-600">
            Search
          </label>
          <input
            id="prog-search"
            type="search"
            value={searchParams.get("q") ?? ""}
            onChange={(e) => setPatch({ q: e.target.value })}
            placeholder="Programme or university…"
            className="mt-1 w-full max-w-md rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="uni-filter" className="block text-xs font-medium text-slate-600">
              University
            </label>
            <select
              id="uni-filter"
              value={uni}
              onChange={(e) => setPatch({ uni: e.target.value === "All" ? "" : e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {universities.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="field-filter" className="block text-xs font-medium text-slate-600">
              Field of study
            </label>
            <select
              id="field-filter"
              value={field}
              onChange={(e) => setPatch({ field: e.target.value === "All" ? "" : e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort-filter" className="block text-xs font-medium text-slate-600">
              Sort
            </label>
            <select
              id="sort-filter"
              value={sort}
              onChange={(e) => setPatch({ sort: e.target.value === "name_asc" ? "" : e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-600">Field (quick)</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Field quick filter">
            <button
              type="button"
              onClick={() => setPatch({ field: "" })}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                field === "All" ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100",
              ].join(" ")}
            >
              All
            </button>
            {fields
              .filter((f) => f !== "All")
              .map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPatch({ field: f === field ? "" : f })}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    field === f ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100",
                  ].join(" ")}
                >
                  {f}
                </button>
              ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="min-pts" className="block text-xs font-medium text-slate-600">
              Min entry points (at least)
            </label>
            <input
              id="min-pts"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="e.g. 22"
              value={searchParams.get("minPts") ?? ""}
              onChange={(e) => setPatch({ minPts: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label htmlFor="max-pts" className="block text-xs font-medium text-slate-600">
              Min entry points (at most)
            </label>
            <input
              id="max-pts"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="e.g. 32"
              value={searchParams.get("maxPts") ?? ""}
              onChange={(e) => setPatch({ maxPts: e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
            checked={qualifyPoints}
            disabled={predTotal == null}
            onChange={(e) => setPatch({ qualify: e.target.checked ? "1" : "" })}
          />
          <span>
            Show programmes I may reach on <strong>points only</strong> (min pts ≤ my best-six total from the
            predictor
            {predTotal != null ? (
              <>
                : <strong>{predTotal}</strong> pts
              </>
            ) : (
              <> - use the predictor first to set this</>
            )}
            ). Subject requirements are not checked here.
          </span>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-brand-700 underline hover:text-brand-900"
          >
            Clear all filters
          </button>
        )}
      </div>

      <ul className="divide-y divide-brand-100 overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm">
        {filteredSorted.map((p) => {
          const rowEligibility = eligibilityById.get(p.id);
          const compareDisabled = !isSelected(p.id) && !canAdd;
          return (
            <li key={p.id} className="flex items-stretch">
              <div className="flex shrink-0 items-center border-r border-brand-100 px-2">
                <label className={`flex items-center p-1 ${compareDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
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
                state={{ fromProgrammes: location.search }}
                className="flex min-w-0 flex-1 flex-col gap-2 px-3 py-3 transition hover:bg-brand-50 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4"
              >
                <div className="min-w-0">
                  <span className="font-medium text-brand-900">{p.name}</span>
                  <p className="text-xs text-slate-500">
                    {p.university}
                    {p.field ? ` · ${p.field}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  {rowEligibility ? <EligibilityPill eligibility={rowEligibility} /> : null}
                  <span className="text-xs font-medium text-brand-700">
                    {programmeHasAdmissionPoints(p) ? `Min ${p.minPoints} pts` : "Min pts not listed"} →
                  </span>
                </div>
              </Link>
              <div className="flex items-center pr-2">
                <ProgrammeBookmarkButton
                  programmeId={p.id}
                  programmeName={p.name}
                  pressed={isBookmarked(p.id)}
                  onToggle={() => toggle(p.id)}
                />
              </div>
            </li>
          );
        })}
        {!filteredSorted.length && !error && (
          <li className="px-4 py-8 text-center text-sm text-slate-600">
            <p className="font-medium text-slate-800">No programmes match these filters.</p>
            <p className="mt-2">Try clearing a filter or widening the points range.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm font-semibold text-brand-700 underline"
              >
                Clear all filters
              </button>
            )}
          </li>
        )}
      </ul>

      {compareIds.length > 0 ? <CompareSelectionBar ids={compareIds} onClear={clearCompare} /> : null}
    </div>
  );
}
