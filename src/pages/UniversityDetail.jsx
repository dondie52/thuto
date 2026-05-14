import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UniversityApplicationBlock from "../components/UniversityApplicationBlock.jsx";
import { fetchUniversities } from "../lib/universitiesData.js";
import { fetchProgrammes, programmeBelongsToUniversity } from "../lib/programmesData.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

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

  return (
    <article className="space-y-6">
      <Link to="/universities" className="inline-block text-sm font-medium text-brand-700 hover:underline">
        ← Universities
      </Link>

      <header className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {university.logo ? (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-white p-3 shadow-sm">
              <img src={assetUrl(university.logo)} alt={`${university.name} logo`} className="max-h-full max-w-full object-contain" />
            </div>
          ) : null}
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
          {university.website && (
            <div>
              <dt className="text-xs font-medium text-slate-500">Website</dt>
              <dd>
                <a
                  href={university.website}
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
    </article>
  );
}
