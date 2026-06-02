import { Link } from "react-router-dom";
import OpportunityPostsFeed from "../components/OpportunityPostsFeed.jsx";
import { OPPORTUNITY_CATEGORY } from "../lib/opportunityPosts.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { usePageContent } from "../hooks/usePageContent.js";
import { PAGE_CONTENT_DEFAULTS } from "../lib/pageContentDefaults.js";

export default function Internships() {
  useDocumentTitle("Internships | Thuto");
  const { content } = usePageContent("internships", PAGE_CONTENT_DEFAULTS.internships);

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

      <section aria-labelledby="internships-feed-heading">
        <h2 id="internships-feed-heading" className="font-display text-lg font-semibold text-brand-900">
          {content.announcements?.heading}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{content.announcements?.body}</p>
        <div className="mt-4">
          <OpportunityPostsFeed
            category={OPPORTUNITY_CATEGORY.INTERNSHIP}
            emptyTitle={content.announcements?.emptyTitle}
            emptyBody={content.announcements?.emptyBody}
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
        Thuto does not accept applications here, follow each post instructions to apply on original channels.
      </p>
    </div>
  );
}
