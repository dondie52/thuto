import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import UniversityInitialsBadge from "../UniversityInitialsBadge.jsx";
import { fetchUniversities } from "../../lib/universitiesData.js";
import { deriveUniversityInitials } from "../../lib/universityBranding.js";
import { landingTo, useLandingAuth } from "./LandingAuthContext.jsx";
import LandingReveal from "./LandingReveal.jsx";

// Spread across the live markets rather than Botswana only — the catalogue now covers seven
// countries, and a Botswana-only strip misrepresents it to a first-time visitor.
const DEFAULT_FEATURED_IDS = [
  "ub",
  "biust",
  "buan",
  "botho",
  "bou",
  "uct",
  "wits",
  "up",
  "stellenbosch",
  "ukzn",
  "university-of-zambia",
  "international-university-of-management",
];

export default function UniversitiesSection({ content }) {
  const [universitiesById, setUniversitiesById] = useState(new Map());
  const { isSignedIn } = useLandingAuth();

  useEffect(() => {
    let cancelled = false;
    // The landing strip advertises the whole catalogue, so it is never scoped to one market.
    fetchUniversities({ includeAllCountries: true })
      .then(({ list }) => {
        if (cancelled) return;
        setUniversitiesById(new Map(list.map((u) => [u.id, u])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredInstitutions = useMemo(() => {
    const ids = Array.isArray(content?.featuredUniversityIds) ? content.featuredUniversityIds : DEFAULT_FEATURED_IDS;
    // Drop ids with no matching record instead of rendering the raw slug as a name — a
    // CMS-supplied list can point at institutions that no longer exist.
    return ids.map((id) => universitiesById.get(id)).filter(Boolean);
  }, [content?.featuredUniversityIds, universitiesById]);

  function institutionLabel(university) {
    return university.name || deriveUniversityInitials(university);
  }

  return (
    <section
      id="universities"
      className="scroll-mt-24 overflow-hidden border-t border-emerald-950/10 bg-[var(--thuto-surface-elevated)] py-16 sm:py-24"
      aria-labelledby="unis-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">{content?.kicker}</p>
            <LandingReveal
              as="h2"
              id="unis-heading"
              className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
            >
              {content?.heading}
            </LandingReveal>
            <LandingReveal as="p" className="mt-4 max-w-xl text-base leading-relaxed text-slate-600" delay={80}>
              {content?.body}
            </LandingReveal>
          </div>

          <LandingReveal
            className="grid grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-6 sm:p-5"
            delay={140}
          >
            {featuredInstitutions.map((u) => (
              <Link
                key={u.id}
                to={landingTo(isSignedIn, `/universities/${u.id}`, "#universities")}
                className="flex flex-col items-center justify-start gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                aria-label={institutionLabel(u)}
              >
                <UniversityInitialsBadge university={u} size="md" />
                <span className="line-clamp-2 text-center text-[10px] font-semibold leading-tight text-slate-700">
                  {institutionLabel(u)}
                </span>
              </Link>
            ))}
          </LandingReveal>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={landingTo(isSignedIn, "/universities", "#universities")}
              className="focus-ring landing-motion-press inline-flex min-h-11 items-center justify-center rounded-md bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-800"
            >
              {isSignedIn ? content?.ctaSignedIn : content?.ctaGuest}
            </Link>
            <span className="text-sm text-slate-500">{content?.note}</span>
          </div>
          {content?.affiliationNote ? (
            <p className="max-w-3xl text-xs leading-relaxed text-slate-500">{content.affiliationNote}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
