import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  APPLICATION_DATES_DISCLAIMER,
  daysFromTodayTo,
  formatCountdown,
  isDeadlineWithinDays,
} from "../lib/applicationDates.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import { fetchProgrammes } from "../lib/programmesData.js";
import {
  fundingSpotlightForDay,
  localCalendarDateKey,
  pickDistinctBySeed,
  programmeEligibleForSpotlight,
} from "../lib/weeklyHomeSpotlight.js";
import { fetchGeminiHomeSpotlight, isHomeSpotlightAiEnabled } from "../lib/fetchHomeSpotlight.js";
import { safeExternalUrl } from "../lib/urlSafety.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import ProgrammeThemeHero from "../components/ProgrammeThemeHero.jsx";

const cards = [
  {
    to: "/predictor",
    title: "Check eligibility",
    body: "Start with real or estimated BGCSE grades and see which programmes you may qualify for.",
  },
  {
    to: "/fit-finder",
    title: "Programme fit finder",
    body: "Match your grades and interests to programmes - strong picks, alternatives, and stretch ideas.",
  },
  {
    to: "/programmes",
    title: "Programmes",
    body: "Browse courses, entry requirements, modules, and career ideas.",
  },
  {
    to: "/saved",
    title: "Saved programmes",
    body: "Shortlist favourites on this device and jump back to them anytime.",
  },
  {
    to: "/compare",
    title: "Compare programmes",
    body: "Select up to three programmes and open a shareable side-by-side table.",
  },
  {
    to: "/universities",
    title: "Universities",
    body: "Institutions, locations, and application windows.",
  },
  {
    to: "/sponsorships",
    title: "Sponsorships & funding",
    body: "Government sponsorship steps (DTEF online portal), private sponsor posts, and other funding routes.",
  },
  {
    to: "/internships",
    title: "Internships",
    body: "Latest internship windows copied from official posts—apply on the original channel.",
  },
];

/** Shown if the programme directory fails to load (ids match sample landing content). */
const FALLBACK_DAILY_PROGRAMMES = [
  { id: "ub-bsc-cs", name: "BSc Computer Science", university: "University of Botswana", minPoints: 42 },
  { id: "biust-bsc-data", name: "BSc Data Science", university: "BIUST", minPoints: 43 },
  { id: "bac-bcom-accounting", name: "BCom Accounting", university: "Botswana School of Business Sciences", minPoints: 38 },
];

/**
 * @param {Array<{ id: string, name: string, university?: string, minPoints?: number | null }>} pool
 * @param {string} calendarDayKey
 * @param {Array<{ id: string, teaser?: string }>} aiOrder
 */
function mergeFeaturedWithLocal(pool, calendarDayKey, aiOrder) {
  const byId = new Map(pool.map((p) => [p.id, p]));
  const seed = `${calendarDayKey}|daily-programmes|v1`;
  const localPicked = pool.length >= 3 ? pickDistinctBySeed(pool, 3, seed) : FALLBACK_DAILY_PROGRAMMES;

  const merged = [];
  const used = new Set();
  let aiUsedCount = 0;
  for (const row of aiOrder) {
    const base = byId.get(row.id);
    if (!base || used.has(row.id)) continue;
    used.add(row.id);
    aiUsedCount += 1;
    merged.push({ ...base, teaser: row.teaser });
  }
  for (const base of localPicked) {
    if (merged.length >= 3) break;
    if (used.has(base.id)) continue;
    used.add(base.id);
    merged.push(base);
  }
  return { list: merged.slice(0, 3), source: aiUsedCount >= 2 ? "gemini" : "local" };
}

export default function Home() {
  useDocumentTitle("Thuto - Your Botswana University Companion");
  const [urgentUnis, setUrgentUnis] = useState([]);
  /** @type {'remote' | 'bundled' | null} */
  const [uniDataSource, setUniDataSource] = useState(null);
  const [calendarDayKey, setCalendarDayKey] = useState(() => localCalendarDateKey());
  const fallbackFunding = fundingSpotlightForDay(calendarDayKey);
  /** @type {Array<{ id: string, name: string, university?: string, minPoints?: number | null, teaser?: string }>} */
  const [dailyProgrammes, setDailyProgrammes] = useState([]);
  const [dailyProgrammesReady, setDailyProgrammesReady] = useState(false);
  /** @type {'gemini' | 'local'} */
  const [programmeSpotlightSource, setProgrammeSpotlightSource] = useState("local");
  /** @type {{ title: string, body: string, groundingNote?: string, officialLink?: string | null } | null} */
  const [geminiScholarship, setGeminiScholarship] = useState(null);
  const [scholarshipUsedSearch, setScholarshipUsedSearch] = useState(false);

  useEffect(() => {
    const syncDay = () => {
      const next = localCalendarDateKey();
      setCalendarDayKey((prev) => (prev !== next ? next : prev));
    };
    const id = setInterval(syncDay, 30_000);
    const onVis = () => {
      if (!document.hidden) syncDay();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    fetchUniversities({ signal: ac.signal })
      .then(({ list, source }) => {
        if (cancelled) return;
        setUniDataSource(source);
        const urgent = list
          .filter((u) => u.applicationClose && isDeadlineWithinDays(u.applicationClose, 30))
          .map((u) => ({
            ...u,
            daysLeft: daysFromTodayTo(u.applicationClose),
          }))
          .filter((u) => u.daysLeft != null && u.daysLeft >= 0)
          .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
        setUrgentUnis(urgent);
      })
      .catch(() => {
        if (!cancelled) {
          setUrgentUnis([]);
          setUniDataSource(null);
        }
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    setDailyProgrammesReady(false);
    setGeminiScholarship(null);
    setScholarshipUsedSearch(false);
    setProgrammeSpotlightSource("local");

    fetchProgrammes({ signal: ac.signal, cacheBuster: calendarDayKey })
      .then(async (list) => {
        if (cancelled) return;
        const pool = list.filter(programmeEligibleForSpotlight).sort((a, b) => a.id.localeCompare(b.id));
        const seed = `${calendarDayKey}|daily-programmes|v1`;
        const localPicked = pool.length >= 3 ? pickDistinctBySeed(pool, 3, seed) : FALLBACK_DAILY_PROGRAMMES;

        let display = localPicked;
        let source = "local";

        const tryAi =
          isHomeSpotlightAiEnabled() &&
          typeof navigator !== "undefined" &&
          navigator.onLine !== false &&
          pool.length >= 12;

        if (tryAi) {
          const candidatePool =
            pool.length >= 80
              ? pickDistinctBySeed(pool, 80, `${calendarDayKey}|spotlight-candidates|v1`)
              : pool;
          const programmeCandidates = candidatePool.map((p) => ({
            id: p.id,
            name: p.name,
            university: p.university,
            minPoints: typeof p.minPoints === "number" ? p.minPoints : undefined,
          }));

          const ai = await fetchGeminiHomeSpotlight({ calendarDayKey, programmeCandidates });
          if (!cancelled && ai?.scholarship?.body) {
            setGeminiScholarship(ai.scholarship);
            setScholarshipUsedSearch(Boolean(ai.usedGoogleSearch));
          }

          if (!cancelled && Array.isArray(ai?.featuredProgrammes) && ai.featuredProgrammes.length > 0) {
            const merged = mergeFeaturedWithLocal(pool, calendarDayKey, ai.featuredProgrammes);
            display = merged.list;
            source = merged.source === "gemini" && ai.featuredProgrammes.length >= 2 ? "gemini" : merged.source;
          }
        }

        if (!cancelled) {
          setDailyProgrammes(display);
          setProgrammeSpotlightSource(source);
          setDailyProgrammesReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDailyProgrammes(FALLBACK_DAILY_PROGRAMMES);
          setProgrammeSpotlightSource("local");
          setDailyProgrammesReady(true);
        }
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [calendarDayKey]);

  const scholarshipOfficial = geminiScholarship ? safeExternalUrl(geminiScholarship.officialLink) : "";

  return (
    <div className="space-y-10">
      {urgentUnis.length > 0 && (
        <div
          className="animate-fade-up rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-100/80 p-4 shadow-card"
          role="status"
        >
          <p className="font-display text-sm font-semibold text-amber-950">Application deadlines soon</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-950/85">
            {uniDataSource === "remote"
              ? "One or more institutions have an application close date within the next 30 days. Dates are loaded from the live Thuto data feed - still confirm on each university’s official site."
              : "One or more institutions have an application close date within the next 30 days (bundled sample dates in Thuto until a live feed URL is configured)."}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {urgentUnis.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-t border-amber-200/70 pt-2 first:border-t-0 first:pt-0"
              >
                <Link
                  to={`/universities/${u.id}`}
                  className="focus-ring rounded font-medium text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
                >
                  {u.name}
                </Link>
                <span className="text-xs font-semibold text-amber-900">
                  {u.applicationClose ? formatCountdown(u.applicationClose) : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] leading-snug text-amber-900/80">{APPLICATION_DATES_DISCLAIMER}</p>
          <Link
            to="/universities"
            className="focus-ring mt-2 inline-block rounded text-xs font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
          >
            All universities
          </Link>
        </div>
      )}

      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-brand-700/20 bg-gradient-to-br from-brand-700 via-brand-800 to-[#0a3d39] p-6 text-white shadow-card sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-64 rounded-full bg-teal-300/10 blur-2xl"
          aria-hidden
        />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">Thuto · BUC</p>
        <h1 className="relative mt-3 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          Check what your BGCSE results may qualify you for
        </h1>
        <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-brand-100/95">
          Start with your grades, get indicative programme matches, and use the result to build a shortlist before you
          confirm details with each institution.
        </p>
        <Link
          to="/predictor"
          className="focus-ring-on-dark relative mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 shadow-md transition hover:bg-brand-50 hover:shadow-lg"
        >
          Check eligibility
        </Link>
      </section>

      <section className="animate-fade-up space-y-3" aria-labelledby="daily-programmes-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
              {programmeSpotlightSource === "gemini" ? "Gemini + your directory" : "Live directory"}
            </p>
            <h2 id="daily-programmes-heading" className="font-display text-xl font-semibold tracking-tight text-brand-900">
              Today{"'"}s featured programmes
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              {programmeSpotlightSource === "gemini"
                ? "Picks are chosen for you by Thuto’s Gemini integration using real programme ids from this app, refreshed each calendar day (cached for this session)."
                : "Three picks refresh every day at local midnight and reload the programme list from the server so you see the latest directory."}{" "}
              Indicative only—subject rules and institution notices still apply.
            </p>
          </div>
          <Link
            to="/programmes"
            className="focus-ring shrink-0 rounded text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
          >
            Browse all
          </Link>
        </div>
        {!dailyProgrammesReady ? (
          <ul className="grid gap-3 sm:grid-cols-3" aria-busy="true" aria-label={"Loading today's programme picks"}>
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-[7.5rem] animate-pulse rounded-2xl border border-stone-200/80 bg-stone-100/80" />
            ))}
          </ul>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-3">
            {dailyProgrammes.map((p, i) => (
              <li key={p.id} className="animate-fade-up" style={{ animationDelay: `${60 + i * 50}ms` }}>
                <Link
                  to={`/programmes/${p.id}`}
                  className="focus-ring flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-[var(--thuto-surface-elevated)] shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
                >
                  <ProgrammeThemeHero programme={p} variant="card">
                    {p.university ? (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-white/90">{p.university}</span>
                    ) : null}
                    <h3 className="mt-1 font-display text-base font-semibold leading-snug text-white">{p.name}</h3>
                  </ProgrammeThemeHero>
                  <div className="flex flex-1 flex-col p-4">
                    {typeof p.minPoints === "number" ? (
                      <p className="text-sm text-stone-500">From {p.minPoints} points in the directory</p>
                    ) : null}
                    {p.teaser ? <p className="mt-2 text-sm leading-relaxed text-stone-600">{p.teaser}</p> : null}
                    <span className="mt-auto pt-3 text-sm font-semibold text-brand-700">
                      View programme <span aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="animate-fade-up" aria-labelledby="daily-scholarship-heading">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
          {geminiScholarship ? (scholarshipUsedSearch ? "Gemini + web search" : "Gemini summary") : "Daily tip"}
        </p>
        <h2 id="daily-scholarship-heading" className="font-display text-xl font-semibold tracking-tight text-brand-900">
          Today{"'"}s scholarship spotlight
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">
          {geminiScholarship
            ? "Generated with Google Gemini (and search when available). Verify every detail on official sites—models can be wrong or out of date."
            : "A funding topic to explore, chosen for this calendar day. Thuto does not process awards—always confirm on official funder and university notices."}
        </p>
        <article className="mt-3 rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/40 p-4 shadow-card sm:p-5">
          <h3 className="font-display text-lg font-semibold text-brand-900">
            {geminiScholarship ? geminiScholarship.title : fallbackFunding.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {geminiScholarship ? geminiScholarship.body : fallbackFunding.body}
          </p>
          {geminiScholarship?.groundingNote ? (
            <p className="mt-2 text-xs leading-relaxed text-stone-500">{geminiScholarship.groundingNote}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to={geminiScholarship ? "/sponsorships" : fallbackFunding.to}
              className="focus-ring inline-flex min-h-10 items-center rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
            >
              {geminiScholarship ? "Funding routes in Thuto" : fallbackFunding.cta}
            </Link>
            {scholarshipOfficial ? (
              <a
                href={scholarshipOfficial}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
              >
                Official link (new tab)
              </a>
            ) : null}
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold tracking-tight text-brand-900">Get started</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ to, title, body }, i) => (
            <li
              key={to}
              className="animate-fade-up"
              style={{ animationDelay: `${80 + i * 45}ms` }}
            >
              <Link
                to={to}
                className="focus-ring group relative flex h-full flex-col rounded-2xl border border-stone-200/90 bg-[var(--thuto-surface-elevated)] p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover"
              >
                <span
                  className="absolute left-0 top-4 h-10 w-1 rounded-r-full bg-brand-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <h3 className="font-display text-base font-semibold text-brand-900">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition group-hover:gap-2">
                  Open
                  <span aria-hidden>→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
