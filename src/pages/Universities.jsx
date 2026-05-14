import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UniversityApplicationBlock from "../components/UniversityApplicationBlock.jsx";
import { fetchUniversities } from "../lib/universitiesData.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

export default function Universities() {
  useDocumentTitle("Universities | Thuto");
  const [universities, setUniversities] = useState([]);
  const [error, setError] = useState(null);
  /** @type {'remote' | 'bundled' | null} */
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-900">Universities</h1>
        <p className="mt-2 text-sm text-slate-600">
          {count === 0
            ? "Loading institutions…"
            : `${count} institution${count === 1 ? "" : "s"} in Thuto - ${
                dataSource === "remote"
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

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {universities.map((u) => (
          <li
            key={u.id}
            className="flex flex-col rounded-2xl border border-brand-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-1 flex-col">
              {u.logo ? (
                <Link
                  to={`/universities/${u.id}`}
                  className="mb-4 flex h-24 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50/40 p-4 transition hover:border-brand-300 hover:bg-brand-50"
                  aria-label={`${u.name} profile`}
                >
                  <img src={assetUrl(u.logo)} alt={`${u.name} logo`} className="max-h-full max-w-full object-contain" />
                </Link>
              ) : null}
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-brand-900">
                  <Link to={`/universities/${u.id}`} className="hover:text-brand-700 hover:underline">
                    {u.name}
                  </Link>
                </h2>
                <p className="mt-1 text-xs font-medium text-brand-600">{u.location}</p>
              </div>
              {u.featured ? (
                <span className="mt-2 inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                  Featured institution
                </span>
              ) : null}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{u.description}</p>
              <div className="mt-4">
                <UniversityApplicationBlock university={u} compact profileLink />
              </div>
              <dl className="mt-4 space-y-2 border-t border-brand-100 pt-4 text-xs text-slate-600">
                {u.phone && (
                  <div>
                    <dt className="font-medium text-slate-500">Phone</dt>
                    <dd>
                      <a href={`tel:${String(u.phone).replace(/\s/g, "")}`} className="text-brand-700 hover:underline">
                        {u.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {u.website && (
                  <div>
                    <dt className="font-medium text-slate-500">Website</dt>
                    <dd>
                      <a
                        href={u.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-medium text-brand-700 hover:underline"
                      >
                        {u.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
