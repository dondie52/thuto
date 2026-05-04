import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UniversityApplicationBlock from "../components/UniversityApplicationBlock.jsx";
import { fetchUniversities } from "../lib/universitiesData.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function UniversityDetail() {
  const { id } = useParams();
  const [university, setUniversity] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <article className="space-y-6">
      <Link to="/universities" className="inline-block text-sm font-medium text-brand-700 hover:underline">
        ← Universities
      </Link>

      <header className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h1 className="font-display text-xl font-bold text-brand-900 sm:text-2xl">{university.name}</h1>
        <p className="mt-1 text-sm font-medium text-brand-600">{university.location}</p>
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
    </article>
  );
}
