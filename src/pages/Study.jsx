import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StudyFocusBanner from "../components/StudyFocusBanner.jsx";
import StudySubjectCard from "../components/StudySubjectCard.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";
import { fetchProgrammes } from "../lib/programmesData.js";
import {
  computeFocusSubjects,
  fetchStudy,
  filterStudySubjects,
  programmesForRequirementKey,
  readPredictorSession,
} from "../lib/studyData.js";
import { SUBJECTS_BY_ID } from "../lib/bgcseSubjects.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

function IconExternal({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14L21 3M21 14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6" />
    </svg>
  );
}

export default function Study() {
  useDocumentTitle("BGCSE Study | Thuto");
  const { content } = usePageContent("study", PAGE_CONTENT_DEFAULTS.study);
  const [catalog, setCatalog] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    Promise.all([fetchStudy({ signal: ac.signal }), fetchProgrammes({ signal: ac.signal })])
      .then(([studyData, programmeData]) => {
        if (!cancelled) {
          setCatalog(studyData);
          setProgrammes(programmeData);
        }
      })
      .catch((err) => {
        if (!cancelled && err.name !== "AbortError") setLoadError("Could not load study resources. Try again later.");
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const focusSubjects = useMemo(
    () => computeFocusSubjects(programmes, readPredictorSession()),
    [programmes],
  );

  const filteredSubjects = useMemo(() => {
    if (!catalog?.subjects) return [];
    return filterStudySubjects(catalog.subjects, query);
  }, [catalog, query]);

  const programmeCountBySubject = useMemo(() => {
    const counts = {};
    for (const entry of catalog?.subjects || []) {
      const meta = SUBJECTS_BY_ID[entry.bgcseSubjectId || entry.id];
      counts[entry.id] = programmesForRequirementKey(programmes, meta?.requirementKey).length;
    }
    return counts;
  }, [catalog, programmes]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-white via-brand-50/50 to-brand-100/30 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-300/25 blur-2xl" aria-hidden />
        <div className="relative min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">{content.hero?.kicker}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-brand-900">{content.hero?.title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">{content.hero?.body}</p>
        </div>
      </div>

      <StudyFocusBanner focusSubjects={focusSubjects} />

      {catalog?.featuredSections?.length ? (
        <section aria-labelledby="study-featured-heading">
          <h2 id="study-featured-heading" className="font-display text-lg font-semibold text-brand-900">
            {content.featured?.heading}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{content.featured?.body}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {catalog.featuredSections.map((section) => {
              const href = safeExternalUrl(section.url);
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-semibold text-brand-900">{section.title}</h3>
                    {section.badge ? (
                      <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800">
                        {section.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{section.description}</p>
                  {href ? (
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-800">
                      Open official resource <IconExternal />
                    </span>
                  ) : null}
                </>
              );
              return (
                <li key={section.id}>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring block h-full rounded-2xl border border-brand-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="h-full rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-500">{content.featured?.attribution}</p>
        </section>
      ) : null}

      <section aria-labelledby="study-subjects-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="study-subjects-heading" className="font-display text-lg font-semibold text-brand-900">
              {content.subjects?.heading}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{content.subjects?.body}</p>
          </div>
          <label className="w-full max-w-xs">
            <span className="sr-only">Search subjects</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subjects…"
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
        </div>

        {loadError ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {loadError}
          </p>
        ) : null}

        {!catalog && !loadError ? (
          <p className="mt-4 text-sm text-slate-500" role="status">
            Loading study resources…
          </p>
        ) : null}

        {catalog && filteredSubjects.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No subjects match your search.</p>
        ) : null}

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((entry) => {
            const meta = SUBJECTS_BY_ID[entry.bgcseSubjectId || entry.id];
            return (
              <li key={entry.id}>
                <StudySubjectCard
                  subjectId={entry.id}
                  label={meta?.label ?? entry.id}
                  requirementKey={meta?.requirementKey}
                  programmeCount={programmeCountBySubject[entry.id] ?? 0}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-stone-800">
        <p className="font-semibold text-stone-900">{content.verify?.title}</p>
        <p className="mt-1 leading-relaxed">{content.verify?.body}</p>
        <Link to="/predictor" className="mt-3 inline-flex font-semibold text-brand-800 underline">
          {content.verify?.linkLabel}
        </Link>
      </div>

      <p className="text-center text-sm leading-relaxed text-slate-500">{content.footerNote}</p>
    </div>
  );
}
