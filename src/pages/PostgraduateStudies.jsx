import { Link } from "react-router-dom";
import OpportunityPostsFeed from "../components/OpportunityPostsFeed.jsx";
import { OPPORTUNITY_CATEGORY } from "../lib/opportunityPosts.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";

function ProgrammeRouteCard({ title, body, to, countLabel }) {
  return (
    <Link
      to={to}
      className="focus-ring flex flex-col rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
    >
      <h3 className="font-display text-lg font-semibold text-brand-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{body}</p>
      {countLabel ? <p className="mt-3 text-xs font-semibold text-brand-700">{countLabel}</p> : null}
      <p className="mt-3 text-xs font-semibold text-brand-700">Browse programmes →</p>
    </Link>
  );
}

export default function PostgraduateStudies() {
  useDocumentTitle("Postgraduate Studies | Thuto");
  const { content } = usePageContent("postgraduateStudies", PAGE_CONTENT_DEFAULTS.postgraduateStudies);

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

      <section aria-labelledby="pg-programmes-heading">
        <h2 id="pg-programmes-heading" className="font-display text-lg font-semibold text-brand-900">
          {content.programmes?.heading}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{content.programmes?.body}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ProgrammeRouteCard
            title={content.programmes?.mastersTitle}
            body={content.programmes?.mastersBody}
            to="/programmes?level=postgraduate"
          />
          <ProgrammeRouteCard
            title={content.programmes?.phdTitle}
            body={content.programmes?.phdBody}
            to="/programmes?level=phd"
          />
        </div>
        <p className="mt-4 text-sm text-slate-600">
          {content.programmes?.fitFinderPrefix}{" "}
          <Link to="/fit-finder" className="font-semibold text-brand-800 underline">
            {content.programmes?.fitFinderLinkText}
          </Link>
        </p>
      </section>

      <section aria-labelledby="pg-scholarships-heading">
        <h2 id="pg-scholarships-heading" className="font-display text-lg font-semibold text-brand-900">
          {content.scholarships?.heading}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{content.scholarships?.body}</p>
        <div className="mt-4">
          <OpportunityPostsFeed
            category={OPPORTUNITY_CATEGORY.POSTGRADUATE_SCHOLARSHIP}
            emptyTitle={content.scholarships?.emptyTitle}
            emptyBody={content.scholarships?.emptyBody}
          />
        </div>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-stone-800">
        <p className="font-semibold text-stone-900">{content.verify?.title}</p>
        <p className="mt-1 leading-relaxed">{content.verify?.body}</p>
        <Link to="/sponsorships" className="mt-3 inline-flex font-semibold text-brand-800 underline">
          {content.verify?.linkLabel}
        </Link>
      </div>

      <p className="text-center text-sm leading-relaxed text-slate-500">
        Thuto does not accept applications here — follow each post or programme link to apply on the original channel.
      </p>
    </div>
  );
}
