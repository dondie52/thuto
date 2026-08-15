import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import UniversityInitialsBadge from "../UniversityInitialsBadge.jsx";
import { fetchUniversities } from "../../lib/universitiesData.js";
import { fetchVerifiedPartnersForMarketing } from "../../lib/partner.js";
import { deriveUniversityInitials } from "../../lib/universityBranding.js";

const DEFAULT_FEATURED_IDS = ["ub", "biust", "buan", "botho", "bac", "bou", "limkokwing"];

export default function PartnersLogos({ content }) {
  const [universitiesById, setUniversitiesById] = useState(new Map());
  const [verifiedIds, setVerifiedIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    // Verified partners span every market, so this must not be scoped to the viewer's country.
    Promise.all([fetchUniversities({ includeAllCountries: true }), fetchVerifiedPartnersForMarketing()])
      .then(([uniData, verifiedPartners]) => {
        if (cancelled) return;
        setUniversitiesById(new Map((uniData.list || []).map((u) => [u.id, u])));
        setVerifiedIds(verifiedPartners.map((row) => row.institutionId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const institutions = useMemo(() => {
    const fallbackIds = Array.isArray(content?.featuredUniversityIds) ? content.featuredUniversityIds : DEFAULT_FEATURED_IDS;
    const orderedIds = verifiedIds.length ? [...new Set([...verifiedIds, ...fallbackIds])] : fallbackIds;
    return orderedIds
      .map((id) => {
        const university = universitiesById.get(id);
        // Skip unknown ids rather than rendering the raw slug as an institution name.
        return university ? { ...university, verified: verifiedIds.includes(id) } : null;
      })
      .filter(Boolean)
      .slice(0, 12);
  }, [content?.featuredUniversityIds, universitiesById, verifiedIds]);

  return (
    <section className="rounded-2xl border border-brand-100 bg-slate-50/70 p-5 sm:p-6" aria-labelledby="partners-logos-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="partners-logos-heading" className="font-display text-xl font-bold text-brand-950 sm:text-2xl">
            {content?.heading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{content?.body}</p>
          {content?.affiliationNote ? (
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500">{content.affiliationNote}</p>
          ) : null}
        </div>
        {verifiedIds.length ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
            {verifiedIds.length} verified
          </span>
        ) : null}
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Partner institutions">
        {institutions.map((university) => (
          <li key={university.id}>
            <Link
              to={`/universities/${university.id}`}
              className="flex h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-brand-300"
            >
              <div className="flex items-start justify-between gap-2">
                <UniversityInitialsBadge university={university} size="sm" />
                {university.verified ? (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800">
                    Verified
                  </span>
                ) : null}
              </div>
              <p className="truncate text-xs font-semibold text-slate-800">
                {university.shortName || deriveUniversityInitials(university)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
