import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UniversityApplicationBlock from "../components/UniversityApplicationBlock.jsx";
import { fetchUniversities } from "../lib/universitiesData.js";
import { fetchProgrammes, programmeBelongsToUniversity } from "../lib/programmesData.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { deriveUniversityInitials, resolveUniversityLogo } from "../lib/universityBranding.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

function normalizeResources(resources) {
  if (!Array.isArray(resources)) return [];
  return resources
    .map((resource) => ({ ...resource, href: safeExternalUrl(resource?.url) }))
    .filter((resource) => resource?.title && resource.href);
}

function resourceActionLabel(resource) {
  const format = String(resource?.format || "");
  const url = String(resource?.url || "");
  return format.toLowerCase().includes("pdf") || url.toLowerCase().includes(".pdf") ? "Download" : "Open";
}

function isPdfResource(resource) {
  const format = String(resource?.format || "").toLowerCase();
  const url = String(resource?.url || resource?.href || "").toLowerCase();
  return format.includes("pdf") || url.includes(".pdf");
}

function UniversityResourcesSection({ university, resources }) {
  const websiteHref = safeExternalUrl(university.website);
  const applyHref = safeExternalUrl(university.applyUrl);
  const hasResources = resources.length > 0;
  const categories = [...new Set(resources.map((resource) => resource.category).filter(Boolean))];

  return (
    <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand-900">Downloads & resources</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Official guides, calendars, fees and application links from the institution.
          </p>
        </div>
        {hasResources ? (
          <p className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
            {resources.length} {resources.length === 1 ? "resource" : "resources"}
          </p>
        ) : null}
      </div>

      {!hasResources ? (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <p className="text-sm leading-relaxed text-slate-600">
            Official brochures, prospectuses and application guides will appear here when available. Use the links below to
            visit the institution&apos;s website or apply.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {websiteHref ? (
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
              >
                Official website
              </a>
            ) : null}
            {applyHref && applyHref !== websiteHref ? (
              <a
                href={applyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-800"
              >
                Apply online
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {categories.length ? (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Resource categories">
              {categories.map((category) => (
                <span key={category} className="rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold text-brand-800">
                  {category}
                </span>
              ))}
            </div>
          ) : null}

          <ul className="mt-4 grid gap-3">
            {resources.map((resource) => (
              <li key={`${resource.title}-${resource.url}`}>
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-w-0 flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-sm transition hover:border-brand-300 hover:bg-brand-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="flex min-w-0 items-start gap-2 sm:items-center">
                    {isPdfResource(resource) ? (
                      <span
                        className="mt-0.5 inline-flex shrink-0 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 sm:mt-0"
                        aria-hidden
                      >
                        PDF
                      </span>
                    ) : null}
                    <span className="min-w-0">
                      <span className="block break-words font-semibold text-brand-900 group-hover:underline">{resource.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                        {[resource.category, resource.format, resource.sourceLabel].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </span>
                  <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-brand-700 px-3 py-1 text-xs font-semibold text-white">
                    {resourceActionLabel(resource)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Links open the institution&apos;s official site. Files and dates may change.
          </p>
        </>
      )}
    </section>
  );
}


export default function UniversityDetail() {
  const { id } = useParams();
  const [university, setUniversity] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [error, setError] = useState(null);
  const [fieldFilter, setFieldFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    fetchUniversities({ signal: ac.signal })
      .then(({ list }) => {
        if (cancelled) return;
        const found = list.find((u) => u.id === id);
        if (!found) setError("Institution not found.");
        else setUniversity(found);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    fetchProgrammes()
      .then((list) => {
        if (!cancelled) setProgrammes(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const documentTitle = error
    ? "University not found - Thuto"
    : university
      ? `${university.name} | Thuto`
      : "University - Thuto";
  useDocumentTitle(documentTitle);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-800">{error}</p>
        <Link to="/universities" className="text-sm font-medium text-brand-700 underline">
          Back to universities
        </Link>
      </div>
    );
  }

  if (!university) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const forUniversity = programmes.filter((p) => programmeBelongsToUniversity(p, university));
  const fields = ["All", ...new Set(forUniversity.map((p) => p.field).filter(Boolean))];
  const filteredProgrammes = fieldFilter === "All" ? forUniversity : forUniversity.filter((p) => p.field === fieldFilter);
  const resources = normalizeResources(university.resources);
  const websiteHref = safeExternalUrl(university.website);

  return (
    <article className="space-y-6">
      <Link to="/universities" className="inline-block text-sm font-medium text-brand-700 hover:underline">
        ← Universities
      </Link>

      <header className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-white p-3 shadow-sm">
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
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold text-brand-900 sm:text-2xl">{university.name}</h1>
            <p className="mt-1 text-sm font-medium text-brand-600">{university.location}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{university.description}</p>
        <dl className="mt-4 space-y-2 border-t border-brand-100 pt-4 text-sm text-slate-600">
          {university.phone && (
            <div>
              <dt className="text-xs font-medium text-slate-500">Phone</dt>
              <dd>
                <a href={`tel:${String(university.phone).replace(/\s/g, "")}`} className="text-brand-700 hover:underline">
                  {university.phone}
                </a>
              </dd>
            </div>
          )}
          {websiteHref && (
            <div>
              <dt className="text-xs font-medium text-slate-500">Website</dt>
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
      </header>

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900">Applications & intake</h2>
        <div className="mt-3">
          <UniversityApplicationBlock university={university} compact={false} profileLink={false} />
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-brand-900">Programmes offered</h2>
          <p className="text-xs text-slate-500">{forUniversity.length} listed</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Programme field filters">
          {fields.map((field) => (
            <button
              key={field}
              type="button"
              onClick={() => setFieldFilter(field)}
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                fieldFilter === field ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100",
              ].join(" ")}
            >
              {field}
            </button>
          ))}
        </div>
        {filteredProgrammes.length ? (
          <ul className="mt-4 divide-y divide-brand-100 rounded-xl border border-brand-100">
            {filteredProgrammes.map((programme) => (
              <li key={programme.id}>
                <Link
                  to={`/programmes/${programme.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-3 text-sm transition hover:bg-brand-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-brand-900">{programme.name}</span>
                    <span className="text-xs text-slate-500">
                      {programme.field || "General"}
                      {programme.duration ? ` · ${programme.duration}` : ""}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-brand-700">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No programmes match this field filter yet.</p>
        )}
      </section>

      <UniversityResourcesSection university={university} resources={resources} />
    </article>
  );
}
