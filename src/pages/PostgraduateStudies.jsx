import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FeedCategoryPosts from "../components/FeedCategoryPosts.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { inferQualificationLevel } from "../lib/fitFinder.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";
import { fetchProgrammes } from "../lib/programmesData.js";

function IconProgrammes({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function IconScholarship({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M16 7.5a3.5 3.5 0 00-3.5-2H10a3 3 0 000 6h4a3 3 0 010 6h-2.5a3.5 3.5 0 01-3.5-2" />
    </svg>
  );
}

function isPostgraduateProgramme(programme) {
  const level = inferQualificationLevel(programme);
  return level === "postgraduate" || level === "phd";
}

export default function PostgraduateStudies() {
  useDocumentTitle("Post Graduate Studies | Thuto");
  const { content } = usePageContent("postgraduateStudies", PAGE_CONTENT_DEFAULTS.postgraduateStudies);
  const [programmeCount, setProgrammeCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchProgrammes()
      .then((list) => {
        if (!cancelled) {
          setProgrammeCount(list.filter(isPostgraduateProgramme).length);
        }
      })
      .catch(() => {
        if (!cancelled) setProgrammeCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

      <section
        className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm"
        aria-labelledby="postgraduate-programmes-heading"
      >
        <div className="border-b border-brand-100 bg-gradient-to-r from-brand-800/95 to-[#1a4d48] px-4 py-4 text-white sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <IconProgrammes />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">{content.programmes?.kicker}</p>
              <h2 id="postgraduate-programmes-heading" className="mt-1 font-display text-xl font-semibold leading-snug sm:text-2xl">
                {content.programmes?.heading}
              </h2>
            </div>
          </div>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <p className="text-sm leading-relaxed text-slate-600">{content.programmes?.body}</p>
          {programmeCount != null ? (
            <p className="text-sm font-semibold text-brand-900">
              {programmeCount} postgraduate {programmeCount === 1 ? "programme" : "programmes"} in the Thuto directory
            </p>
          ) : null}
          <Link
            to="/programmes?level=postgraduate"
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
          >
            {content.programmes?.ctaLabel}
          </Link>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm"
        aria-labelledby="postgraduate-scholarships-heading"
      >
        <div className="border-b border-brand-100 bg-gradient-to-r from-brand-50 to-white px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-100">
              <IconScholarship />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">{content.scholarships?.kicker}</p>
              <h2 id="postgraduate-scholarships-heading" className="mt-1 font-display text-xl font-semibold leading-snug text-brand-900 sm:text-2xl">
                {content.scholarships?.heading}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{content.scholarships?.body}</p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <FeedCategoryPosts
            category="scholarship"
            emptyTitle={content.scholarships?.emptyTitle}
            emptyBody={content.scholarships?.emptyBody}
          />
        </div>
      </section>

      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">{content.feedNote?.title}</p>
        <p className="mt-1 leading-relaxed">{content.feedNote?.body}</p>
        <Link to="/feed" className="focus-ring mt-3 inline-flex font-semibold text-brand-800 underline">
          {content.feedNote?.linkLabel}
        </Link>
      </div>
    </div>
  );
}
