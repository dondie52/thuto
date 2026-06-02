import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UniversityApplicationBlock from "../components/UniversityApplicationBlock.jsx";
import { fetchUniversities, groupUniversitiesByCategory } from "../lib/universitiesData.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { deriveUniversityInitials, resolveUniversityLogo } from "../lib/universityBranding.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

const assetUrl = (path) => {
  const value = String(path || "").trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `${import.meta.env.BASE_URL}${value.replace(/^\//, "")}`;
};

function InstitutionCard({ university }) {
  const websiteHref = safeExternalUrl(university.website);

  return (
    <li className="flex flex-col rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <div className="flex flex-1 flex-col">
        <div className="flex items-start gap-4">
          <Link
            to={`/universities/${university.id}`}
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-white p-3 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
            aria-label={`${university.name} profile`}
          >
            {resolveUniversityLogo(university) ? (
              <img
                src={assetUrl(resolveUniversityLogo(university))}
                alt={`${university.name} logo`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="inline-flex h-14 min-w-14 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-3 text-sm font-semibold tracking-wide text-brand-800">
                {deriveUniversityInitials(university)}
              </span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-semibold leading-snug text-brand-900">
              <Link to={`/universities/${university.id}`} className="hover:text-brand-700 hover:underline">
                {university.name}
              </Link>
            </h3>
            <p className="mt-2 text-sm font-medium text-brand-600">{university.location}</p>
          </div>
        </div>
        {university.featured ? (
          <span className="mt-2 inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
            Featured institution
          </span>
        ) : null}
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{university.description}</p>
        <div className="mt-4">
          <UniversityApplicationBlock university={university} compact profileLink />
        </div>
        <dl className="mt-4 space-y-2 border-t border-brand-100 pt-4 text-xs text-slate-600">
          {university.phone && (
            <div>
              <dt className="font-medium text-slate-500">Phone</dt>
              <dd>
                <a
                  href={`tel:${String(university.phone).replace(/\s/g, "")}`}
                  className="text-brand-700 hover:underline"
                >
                  {university.phone}
                </a>
              </dd>
            </div>
          )}
          {websiteHref && (
            <div>
              <dt className="font-medium text-slate-500">Website</dt>
              <dd>
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-medium text-brand-700 hover:underline"
                >
                  {university.website}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </li>
  );
}

export default function Universities() {
  useDocumentTitle("Universities | Thuto");
  const [universities, setUniversities] = useState([]);
  const [error, setError] = useState(null);
  /** @type {'remote' | 'bundled' | 'live' | null} */
  const [dataSource, setDataSource] = useState(null);

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

  const count = universities.length;
  const groupedUniversities = groupUniversitiesByCategory(universities);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Universities</h1>
        <p className="mt-2 text-sm text-slate-600">
          {count === 0
            ? "Loading institutions..."
            : `${count} institution${count === 1 ? "" : "s"} in Thuto - ${
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

      <div className="space-y-8">
        {groupedUniversities.map((group) => (
          <section key={group.key} className="space-y-4">
            <div className="flex flex-col gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-brand-900">{group.label}</h2>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">{group.description}</p>
              </div>
              <p className="text-sm font-medium text-brand-700">
                {group.items.length} institution{group.items.length === 1 ? "" : "s"}
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((university) => (
                <InstitutionCard key={university.id} university={university} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
