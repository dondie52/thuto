import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProgrammeThemeHero from "../ProgrammeThemeHero.jsx";
import { fetchDailySpotlightProgrammes } from "../../lib/homeAdvertising.js";

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
export default function HomeDailyProgrammes({
  kicker = "Daily spotlight",
  heading = "Today's featured programmes",
  body = "Courses in rotation — swipe through today's lineup.",
  ctaLabel = "View programme",
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
      const result = await fetchDailySpotlightProgrammes({ fallbackIds }).catch(() => ({
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
      <section className="space-y-4" aria-labelledby="home-daily-programmes-heading" aria-busy="true">
        <div className="h-6 w-40 animate-pulse rounded bg-stone-200" />
        <div className="h-56 animate-pulse rounded-2xl border border-stone-200 bg-stone-100/80" />
      </section>
    );
  }

  if (entries.length === 0) return null;

  const current = entries[index];
  const { programme } = current;
  const showControls = entries.length > 1;

  return (
    <section
      className="space-y-4"
      aria-labelledby="home-daily-programmes-heading"
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
        <h2 id="home-daily-programmes-heading" className="font-display text-2xl font-bold text-brand-900">
          {heading}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">{body}</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-brand-200/90 bg-white shadow-card">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {entries.map((entry) => {
            const slide = entry.programme;
            const description =
              entry.teaser ||
              slide.description ||
              "Explore entry requirements, careers, and how this programme fits your BGCSE results.";
            const metaItems = [
              slide.duration,
              typeof slide.minPoints === "number" ? `${slide.minPoints} pts min` : null,
            ].filter(Boolean);

            return (
              <article key={slide.id} className="w-full shrink-0" aria-hidden={slide.id !== programme.id}>
                <Link
                  to={`/programmes/${slide.id}`}
                  className="focus-ring group block outline-offset-4"
                  tabIndex={slide.id === programme.id ? 0 : -1}
                >
                  <ProgrammeThemeHero programme={slide} variant="card" className="rounded-none">
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.sponsored ? (
                        <span className="rounded-full bg-amber-300/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                          Sponsored
                        </span>
                      ) : null}
                      {slide.field ? (
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ring-1 ring-inset ring-white/25">
                          {slide.field}
                        </span>
                      ) : null}
                    </div>
                    {slide.university ? (
                      <p className="mt-2 text-sm font-medium text-brand-50">{slide.university}</p>
                    ) : null}
                  </ProgrammeThemeHero>

                  <div className="space-y-3 p-5">
                    <h3 className="font-display text-lg font-semibold leading-snug text-brand-900 group-hover:text-brand-700 sm:text-xl">
                      {slide.name}
                    </h3>

                    {metaItems.length ? (
                      <div className="flex flex-wrap gap-2">
                        {metaItems.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-100"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <p className="line-clamp-3 text-sm leading-relaxed text-stone-600">{description}</p>

                    <p className="text-sm font-semibold text-brand-800 group-hover:underline">{ctaLabel} →</p>
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
              className="focus-ring absolute left-2 top-[4.5rem] flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/90 bg-white/95 text-brand-800 shadow-sm hover:bg-brand-50 sm:top-[5.5rem]"
              aria-label="Previous programme"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="focus-ring absolute right-2 top-[4.5rem] flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/90 bg-white/95 text-brand-800 shadow-sm hover:bg-brand-50 sm:top-[5.5rem]"
              aria-label="Next programme"
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
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Featured programmes">
            {entries.map((entry, dotIndex) => (
              <button
                key={entry.programme.id}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`Show ${entry.programme.name}`}
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
