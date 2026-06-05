import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import UniversityApplicationBlock from "../components/UniversityApplicationBlock.jsx";
import {
  fetchUniversities,
  groupUniversitiesByCategory,
  UNIVERSITY_CATEGORY_META,
  UNIVERSITY_CATEGORY_ORDER,
} from "../lib/universitiesData.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import UniversityInitialsBadge from "../components/UniversityInitialsBadge.jsx";
import ExternalSiteLink from "../components/ExternalSiteLink.jsx";
import { safeExternalUrl } from "../lib/urlSafety.js";

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "location_asc", label: "Location (A–Z)" },
];

const INSTITUTION_TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  ...UNIVERSITY_CATEGORY_ORDER.map((key) => ({
    value: key,
    label: UNIVERSITY_CATEGORY_META[key].label,
  })),
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
  if (next.get("type") === "all" || !next.get("type")) next.delete("type");
  if (next.get("sort") === "name_asc") next.delete("sort");
  return next;
}

function sortInstitutions(items, sort) {
  const list = [...items];
  if (sort === "name_desc") {
    list.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
  } else if (sort === "location_asc") {
    list.sort((a, b) => String(a.location || "").localeCompare(String(b.location || "")));
  } else {
    list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }
  return list;
}


function InstitutionCard({ university }) {
  const websiteHref = safeExternalUrl(university.website);

  return (
    <li className="flex flex-col rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
      <div className="flex flex-1 flex-col">
        <div className="flex items-start gap-3">
          <Link
            to={`/universities/${university.id}`}
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-white p-3 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
            aria-label={`${university.name} profile`}
          >
            <UniversityInitialsBadge university={university} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-semibold leading-snug text-brand-900">
              <Link to={`/universities/${university.id}`} className="hover:text-brand-700 hover:underline">
                {university.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm font-medium text-brand-600">{university.location}</p>
          </div>
        </div>
        {university.featured ? (
          <span className="mt-2 inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
            Featured institution
          </span>
        ) : null}
        <p className="mt-3 flex-1 line-clamp-4 text-sm leading-relaxed text-slate-600">{university.description}</p>
        <div className="mt-3">
          <UniversityApplicationBlock university={university} compact />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-brand-100 pt-3 text-xs">
          <Link
            to={`/universities/${university.id}`}
            className="inline-flex items-center rounded-full bg-brand-700 px-3 py-1.5 font-semibold text-white transition hover:bg-brand-800"
          >
            View profile
          </Link>
          {university.phone ? (
            <a
              href={`tel:${String(university.phone).replace(/\s/g, "")}`}
              className="inline-flex items-center rounded-full border border-brand-200 bg-white px-3 py-1.5 font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
            >
              Call
            </a>
          ) : null}
          {websiteHref ? (
            <ExternalSiteLink href={websiteHref} variant="secondary" institutionName={university.name}>
              Website
            </ExternalSiteLink>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function Universities() {
  useDocumentTitle("Tertiary Institutions | Thuto");
  const [searchParams, setSearchParams] = useSearchParams();
  const [universities, setUniversities] = useState([]);
  const [error, setError] = useState(null);
  /** @type {'remote' | 'bundled' | 'live' | null} */
  const [dataSource, setDataSource] = useState(null);

  const institutionType = searchParams.get("type") ?? "all";
  const sort = searchParams.get("sort") ?? "name_asc";

  const setPatch = useCallback(
    (patch) => {
      setSearchParams((prev) => patchSearchParams(prev, patch), { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    fetchUniversities({ signal: ac.signal })
      .then(({ list, source }) => {
        if (!cancelled) {
          setUniversities(list);
          setDataSource(source);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const groupedUniversities = useMemo(() => {
    let groups = groupUniversitiesByCategory(universities);
    if (institutionType !== "all") {
      groups = groups.filter((group) => group.key === institutionType);
    }
    return groups
      .map((group) => ({
        ...group,
        items: sortInstitutions(group.items, sort),
      }))
      .filter((group) => group.items.length > 0);
  }, [universities, institutionType, sort]);

  const visibleCount = useMemo(
    () => groupedUniversities.reduce((total, group) => total + group.items.length, 0),
    [groupedUniversities],
  );

  const count = universities.length;
  const hasActiveFilters = institutionType !== "all" || sort !== "name_asc";

  const activeTypeLabel =
    institutionType === "all"
      ? null
      : INSTITUTION_TYPE_OPTIONS.find((option) => option.value === institutionType)?.label;

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Tertiary Institutions</h1>
        <p className="mt-2 text-sm text-slate-600">
          {count === 0
            ? "Loading institutions..."
            : `${count} institution${count === 1 ? "" : "s"} in Thuto — ${
                dataSource === "live"
                  ? "live superuser edits merged with bundled profiles; verify with each provider."
                  : dataSource === "remote"
                    ? "application windows merged from the live feed and bundled profiles; verify with each provider."
                    : "sample listings; verify details with each provider."
              }`}
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-4 rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="institution-type-filter" className="block text-xs font-medium text-slate-600">
              Institution type
            </label>
            <select
              id="institution-type-filter"
              value={institutionType}
              onChange={(e) => setPatch({ type: e.target.value === "all" ? "" : e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-3 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400 sm:py-2 sm:text-sm"
            >
              {INSTITUTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="institution-sort-filter" className="block text-xs font-medium text-slate-600">
              Sort
            </label>
            <select
              id="institution-sort-filter"
              value={sort}
              onChange={(e) => setPatch({ sort: e.target.value === "name_asc" ? "" : e.target.value })}
              className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-3 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400 sm:py-2 sm:text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-brand-900">{visibleCount}</span> institution
            {visibleCount === 1 ? "" : "s"} shown
            {activeTypeLabel ? (
              <>
                {" "}
                in <span className="font-semibold text-brand-900">{activeTypeLabel}</span>
              </>
            ) : null}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="self-start rounded-lg text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900 sm:self-auto"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-8">
        {groupedUniversities.map((group) => (
          <section key={group.key} className="space-y-4">
            {institutionType === "all" && group.key !== "universities" ? (
              <div className="flex flex-col gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-brand-900">{group.label}</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">{group.description}</p>
                </div>
                <p className="text-sm font-medium text-brand-700">
                  {group.items.length} institution{group.items.length === 1 ? "" : "s"}
                </p>
              </div>
            ) : null}

            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {group.items.map((university) => (
                <InstitutionCard key={university.id} university={university} />
              ))}
            </ul>
          </section>
        ))}

        {!error && count > 0 && visibleCount === 0 ? (
          <p className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-6 text-center text-sm text-slate-600">
            No institutions match this filter.{" "}
            <button type="button" onClick={clearFilters} className="font-semibold text-brand-800 underline">
              Show all types
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}
