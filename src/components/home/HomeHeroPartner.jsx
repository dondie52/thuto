import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UniversityApplicationBlock from "../UniversityApplicationBlock.jsx";
import InstitutionVerificationBadge from "../InstitutionVerificationBadge.jsx";
import UniversityInitialsBadge from "../UniversityInitialsBadge.jsx";
import { fetchHomeHeroPartner } from "../../lib/homeAdvertising.js";

/**
 * @param {{ kicker?: string, ctaLabel?: string }} props
 */
export default function HomeHeroPartner({
  kicker = "Featured partner",
  ctaLabel = "View institution",
}) {
  const [entry, setEntry] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHomeHeroPartner()
      .then((hero) => {
        if (!cancelled) setEntry(hero);
      })
      .catch(() => {
        if (!cancelled) setEntry(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <section className="space-y-3" aria-busy="true" aria-label="Loading featured partner">
        <div className="h-4 w-32 animate-pulse rounded bg-brand-100" />
        <div className="h-44 animate-pulse rounded-3xl border border-brand-100 bg-brand-50/60 sm:h-52" />
      </section>
    );
  }

  if (!entry) return null;

  const { university, sponsored, verified, premium } = entry;

  return (
    <section className="space-y-3" aria-labelledby="home-hero-partner-heading">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{kicker}</p>
      <Link
        to={`/universities/${university.id}`}
        className={[
          "focus-ring group block overflow-hidden rounded-3xl border shadow-card transition-[border-color,box-shadow,transform] duration-300 motion-reduce:transition-none hover:shadow-card-hover motion-safe:hover:-translate-y-0.5",
          premium ? "border-amber-300 bg-brand-900" : "border-brand-200 bg-brand-900",
        ].join(" ")}
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-[var(--thuto-surface-elevated)] p-3 shadow-sm">
              <UniversityInitialsBadge university={university} size="lg" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {sponsored ? (
                  <span className="rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                    Sponsored
                  </span>
                ) : null}
                {verified ? <InstitutionVerificationBadge className="bg-white/15 text-white ring-white/30" /> : null}
              </div>
              <h2
                id="home-hero-partner-heading"
                className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl"
              >
                {university.name}
              </h2>
              {university.location ? (
                <p className="mt-1 text-sm font-medium text-brand-100">{university.location}</p>
              ) : null}
              {university.description ? (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-brand-50">{university.description}</p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0 flex-1 [&_.rounded-xl]:border-white/20 [&_.rounded-xl]:bg-white/10 [&_*]:text-white [&_a]:text-white [&_button]:text-white">
              <UniversityApplicationBlock university={university} compact />
            </div>
            <span className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition-colors group-hover:bg-brand-50">
              {ctaLabel} →
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
