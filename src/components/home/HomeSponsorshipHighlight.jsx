import { useMemo } from "react";
import { Link } from "react-router-dom";
import { fundingSpotlightForDay, localCalendarDateKey } from "../../lib/weeklyHomeSpotlight.js";

/**
 * @param {string | undefined} assetPath
 */
function sponsorshipAssetUrl(assetPath) {
  if (!assetPath) return null;
  return `${import.meta.env.BASE_URL}${assetPath.replace(/^\//, "")}`;
}

/**
 * @param {{ kicker?: string, heading?: string, body?: string, ctaLabel?: string }} props
 */
export default function HomeSponsorshipHighlight({
  kicker = "Sponsorship",
  heading = "Sponsorship highlight",
  body = "Funding routes and notices in rotation — refreshed daily.",
  ctaLabel = "Learn more",
}) {
  const dayKey = useMemo(() => localCalendarDateKey(), []);
  const spotlight = useMemo(() => fundingSpotlightForDay(dayKey), [dayKey]);
  const backgroundUrl = sponsorshipAssetUrl(spotlight.cardBackground);

  return (
    <section className="space-y-4" aria-labelledby="home-sponsorship-highlight-heading">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">{kicker}</p>
        <h2 id="home-sponsorship-highlight-heading" className="font-display text-2xl font-bold text-brand-900">
          {heading}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">{body}</p>
      </div>

      <Link
        to={spotlight.to}
        className="focus-ring group block overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-brand-50/40 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-card-hover"
      >
        <div className="relative min-h-[11rem]">
          {backgroundUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("${backgroundUrl}")` }}
              role="img"
              aria-label=""
            />
          ) : null}
          <div
            className={[
              "absolute inset-0",
              backgroundUrl
                ? "bg-gradient-to-r from-brand-950/92 via-brand-900/80 to-brand-800/55"
                : "bg-gradient-to-br from-brand-900 via-brand-800 to-[#1a4d48]",
            ].join(" ")}
            aria-hidden
          />
          <div className="relative z-10 flex h-full flex-col justify-between gap-4 p-5 sm:p-6">
            <div>
              <span className="inline-flex rounded-full bg-emerald-300/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-950">
                Today&apos;s focus
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
                {spotlight.title}
              </h3>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-brand-50/95 sm:line-clamp-3">
                {spotlight.body}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition group-hover:bg-brand-50">
                {spotlight.cta || ctaLabel} →
              </span>
              <p className="text-xs text-brand-100/90">Refreshes daily</p>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
