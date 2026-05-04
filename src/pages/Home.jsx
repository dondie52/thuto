import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  APPLICATION_DATES_DISCLAIMER,
  daysFromTodayTo,
  formatCountdown,
  isDeadlineWithinDays,
} from "../lib/applicationDates.js";
import { fetchUniversities } from "../lib/universitiesData.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const cards = [
  {
    to: "/predictor",
    title: "Admission predictor",
    body: "Enter your BGCSE grades and see which programmes you may qualify for.",
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
];

export default function Home() {
  useDocumentTitle("Thuto - Your Botswana University Companion");
  const [urgentUnis, setUrgentUnis] = useState([]);
  /** @type {'remote' | 'bundled' | null} */
  const [uniDataSource, setUniDataSource] = useState(null);

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
          Your Botswana university companion
        </h1>
        <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-brand-100/95">
          Explore programmes, check rough eligibility from your points, and read course outlines - all in one
          lightweight app.
        </p>
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
