import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDailySpotlightProgrammes } from "../../lib/homeAdvertising.js";
import { resolveProgrammeVisual } from "../../lib/programmeBranding.js";

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
 * @param {string | undefined} value
 */
function programmeInitials(value) {
  const text = String(value || "PR").trim();
  if (!text) return "PR";
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }
  return text.slice(0, 3).toUpperCase();
}

function IconUniversity({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M6 21V10l6-4 6 4v11M9 21v-4h6v4" />
    </svg>
  );
}

function IconClock({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M12 8v4l2.5 2.5" />
    </svg>
  );
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
        <div className="h-52 animate-pulse rounded-2xl border border-stone-200 bg-stone-100/80" />
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

      <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-card">
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {entries.map((entry) => {
              const slide = entry.programme;
              const { imageUrl, label } = resolveProgrammeVisual(slide);
              const description =
                entry.teaser ||
                slide.description ||
                "Explore entry requirements, careers, and how this programme fits your BGCSE results.";

              return (
                <article key={slide.id} className="w-full shrink-0" aria-hidden={slide.id !== programme.id}>
                  <div className="flex items-start gap-4 p-5 pb-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-brand-50">
                      {imageUrl ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url("${imageUrl}")` }}
                          role="img"
                          aria-label={label}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-950" aria-hidden />
                      )}
                      <div className="absolute inset-0 bg-brand-950/40" aria-hidden />
                      <span className="relative flex h-full w-full items-center justify-center font-display text-sm font-bold text-white drop-shadow">
                        {programmeInitials(slide.universityShort || slide.university)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg font-semibold leading-snug text-brand-900">{slide.name}</h3>
                      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-500">
                        {slide.university ? (
                          <span className="inline-flex items-center gap-1 font-medium text-brand-700">
                            <IconUniversity />
                            {slide.university}
                          </span>
                        ) : null}
                        {slide.field ? (
                          <>
                            <span aria-hidden>·</span>
                            <span>{slide.field}</span>
                          </>
                        ) : null}
                        {slide.duration ? (
                          <>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1">
                              <IconClock />
                              {slide.duration}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-stone-200/90 px-5 py-4">
                    <p className="line-clamp-3 text-sm leading-relaxed text-stone-600">{description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-stone-200/90 px-5 py-4">
          <Link
            to={`/programmes/${programme.id}`}
            className="focus-ring text-sm font-semibold text-brand-800 hover:text-brand-950 hover:underline"
          >
            {ctaLabel} →
          </Link>

          {showControls ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-brand-800 shadow-sm hover:bg-brand-50"
                aria-label="Previous programme"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-brand-800 text-white shadow-sm hover:bg-brand-900"
                aria-label="Next programme"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
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
                  "focus-ring h-2.5 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none",
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
