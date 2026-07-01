import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InstitutionVerificationBadge from "../InstitutionVerificationBadge.jsx";
import UniversityInitialsBadge from "../UniversityInitialsBadge.jsx";
import { fetchDailySpotlightInstitutions, fetchHomeHeroPartner } from "../../lib/homeAdvertising.js";

const AUTO_ADVANCE_MS = 6000;

/**
 * @param {number} total
 * @param {number} index
 */
function wrapIndex(index, total) {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

/**
 * @param {{ heading?: string, body?: string, kicker?: string, ctaLabel?: string, fallbackIds?: string[] }} props
 */
export default function HomeDailySpotlight({
  kicker = "Daily spotlight",
  heading = "Today's featured institutions",
  body = "Partner universities in rotation — a new lineup each day.",
  ctaLabel = "View profile",
  fallbackIds,
}) {
  const [entries, setEntries] = useState([]);
  const [dayKey, setDayKey] = useState("");
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const hero = await fetchHomeHeroPartner().catch(() => null);
      const excludeIds = hero?.university?.id ? [hero.university.id] : [];
      const result = await fetchDailySpotlightInstitutions({ excludeIds, fallbackIds }).catch(() => ({
        dayKey: "",
        entries: [],
      }));
      if (!cancelled) {
        setEntries(result.entries);
        setDayKey(result.dayKey);
        setIndex(0);
        setReady(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fallbackIds]);

  const goTo = useCallback(
    (nextIndex) => {
      setIndex(wrapIndex(nextIndex, entries.length));
    },
    [entries.length],
  );

  const goNext = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  const goPrev = useCallback(() => {
    goTo(index - 1);
  }, [goTo, index]);

  useEffect(() => {
    if (!ready || entries.length <= 1 || paused) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    const timer = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [ready, entries.length, paused, goNext]);

  if (!ready) {
    return (
      <section className="space-y-4" aria-labelledby="home-daily-spotlight-heading" aria-busy="true">
        <div className="h-6 w-40 animate-pulse rounded bg-stone-200" />
        <div className="h-44 animate-pulse rounded-2xl border border-stone-200 bg-stone-100/80" />
      </section>
    );
  }

  if (entries.length === 0) return null;

  const current = entries[index];
  const { university } = current;
  const showControls = entries.length > 1;

  return (
    <section
      className="space-y-4"
      aria-labelledby="home-daily-spotlight-heading"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">{kicker}</p>
        <h2 id="home-daily-spotlight-heading" className="font-display text-2xl font-bold text-brand-900">
          {heading}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">{body}</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-brand-200/90 bg-gradient-to-br from-white via-brand-50/30 to-white shadow-card">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {entries.map((entry) => {
            const slide = entry.university;
            return (
              <article key={slide.id} className="w-full shrink-0 p-5" aria-hidden={slide.id !== university.id}>
                <Link
                  to={`/universities/${slide.id}`}
                  className="focus-ring group block rounded-xl outline-offset-4"
                  tabIndex={slide.id === university.id ? 0 : -1}
                >
                  <div className="flex gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50/80 p-2">
                      <UniversityInitialsBadge university={slide} size="md" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {entry.sponsored ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                            Sponsored
                          </span>
                        ) : null}
                        {entry.verified ? <InstitutionVerificationBadge /> : null}
                        {entry.premium ? (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800">
                            Spotlight
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-1 font-display text-lg font-semibold text-brand-900 group-hover:text-brand-700">
                        {slide.name}
                      </h3>
                      {slide.location ? (
                        <p className="mt-0.5 text-sm font-medium text-brand-700">{slide.location}</p>
                      ) : null}
                      {slide.description ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{slide.description}</p>
                      ) : (
                        <p className="mt-2 text-sm leading-relaxed text-stone-500">
                          Explore programmes, application dates, and campus details on Thuto.
                        </p>
                      )}
                      <p className="mt-3 text-sm font-semibold text-brand-800 group-hover:underline">{ctaLabel} →</p>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {showControls ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="focus-ring absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200/90 bg-white/95 text-brand-800 shadow-sm hover:bg-brand-50"
              aria-label="Previous institution"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="focus-ring absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200/90 bg-white/95 text-brand-800 shadow-sm hover:bg-brand-50"
              aria-label="Next institution"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      {showControls ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Featured institutions">
            {entries.map((entry, dotIndex) => (
              <button
                key={entry.university.id}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`Show ${entry.university.name}`}
                onClick={() => goTo(dotIndex)}
                className={[
                  "focus-ring h-2.5 rounded-full transition-all",
                  dotIndex === index ? "w-6 bg-brand-700" : "w-2.5 bg-stone-300 hover:bg-brand-400",
                ].join(" ")}
              />
            ))}
          </div>
          <p className="text-xs text-stone-500" aria-live="polite">
            {index + 1} of {entries.length}
            {dayKey ? ` · refreshes daily` : ""}
          </p>
        </div>
      ) : null}
    </section>
  );
}
