import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UniversityApplicationBlock from "../UniversityApplicationBlock.jsx";
import InstitutionVerificationBadge from "../InstitutionVerificationBadge.jsx";
import UniversityInitialsBadge from "../UniversityInitialsBadge.jsx";
import { fetchHomeFeaturedInstitutions, fetchHomeHeroPartner } from "../../lib/homeAdvertising.js";

/**
 * @param {{ university: object, sponsored: boolean, verified: boolean, premium: boolean }} entry
 */
function cardClassName({ sponsored, premium }) {
  if (sponsored && premium) {
    return "border-amber-300/90 bg-gradient-to-br from-white to-amber-50/40 shadow-card hover:border-amber-400 hover:shadow-card-hover";
  }
  if (sponsored) {
    return "border-brand-200/90 bg-white shadow-card hover:border-brand-300 hover:shadow-card-hover";
  }
  return "border-stone-200/80 bg-stone-50/60 shadow-sm hover:border-stone-300 hover:shadow-card";
}

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

    async function load() {
      const hero = await fetchHomeHeroPartner().catch(() => null);
      const excludeIds = hero?.university?.id ? [hero.university.id] : [];
      const rows = await fetchHomeFeaturedInstitutions(fallbackIds, { excludeIds }).catch(() => []);
      if (!cancelled) {
        setEntries(rows);
        setReady(true);
      }
    }

    load();
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
          {entries.map((entry, index) => {
            const { university, sponsored, verified, premium } = entry;
            return (
              <li key={university.id} className="animate-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
                <Link
                  to={`/universities/${university.id}`}
                  className={[
                    "focus-ring group flex gap-4 rounded-2xl border p-4 transition duration-300 hover:-translate-y-0.5",
                    cardClassName(entry),
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border p-3",
                      sponsored && premium
                        ? "border-amber-200 bg-amber-50/80"
                        : "border-brand-100 bg-brand-50/60",
                    ].join(" ")}
                  >
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
                      {premium ? (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800">
                          Spotlight
                        </span>
                      ) : null}
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
            );
          })}
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
