import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UniversityApplicationBlock from "../UniversityApplicationBlock.jsx";
import InstitutionVerificationBadge from "../InstitutionVerificationBadge.jsx";
import UniversityInitialsBadge from "../UniversityInitialsBadge.jsx";
import { fetchHomeFeaturedInstitutions } from "../../lib/homeAdvertising.js";

/**
 * @param {{ heading?: string, body?: string, fallbackIds?: string[] }} props
 */
export default function HomeFeaturedUniversities({
  heading = "Featured institutions",
  body = "Partner universities and sponsored spots on Thuto.",
  fallbackIds,
}) {
  const [entries, setEntries] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHomeFeaturedInstitutions(fallbackIds)
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fallbackIds]);

  return (
    <section className="space-y-4" aria-labelledby="home-featured-universities-heading">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Sponsored</p>
        <h2 id="home-featured-universities-heading" className="font-display text-2xl font-bold text-brand-900">
          {heading}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">{body}</p>
      </div>

      {!ready ? (
        <ul className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <li key={index} className="h-36 animate-pulse rounded-2xl border border-stone-200 bg-stone-100/80" />
          ))}
        </ul>
      ) : entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-6 text-sm text-stone-600">
          Partner university spots will appear here.{" "}
          <Link to="/partners" className="font-semibold text-brand-800 underline">
            Partner with Thuto
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map(({ university, sponsored, verified }, index) => (
            <li key={university.id} className="animate-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
              <Link
                to={`/universities/${university.id}`}
                className="focus-ring group flex gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50/60 p-3">
                  <UniversityInitialsBadge university={university} size="md" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {sponsored ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                        Sponsored
                      </span>
                    ) : null}
                    {verified ? <InstitutionVerificationBadge /> : null}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-semibold text-brand-900 group-hover:text-brand-700">
                    {university.name}
                  </h3>
                  {university.location ? (
                    <p className="mt-0.5 text-sm font-medium text-brand-700">{university.location}</p>
                  ) : null}
                  {university.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">{university.description}</p>
                  ) : null}
                  <div className="mt-3">
                    <UniversityApplicationBlock university={university} compact />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/universities"
        className="focus-ring inline-flex text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
      >
        Browse all institutions
      </Link>
    </section>
  );
}
