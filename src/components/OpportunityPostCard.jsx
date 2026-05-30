import { formatOpportunityDate } from "../lib/opportunityPosts.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

function IconExternal({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14L21 3M21 14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6" />
    </svg>
  );
}

/**
 * @param {{ post: import("../lib/opportunityPosts.js").OpportunityPost }}
 */
export default function OpportunityPostCard({ post }) {
  const imageSrc = safeExternalUrl(post.imageUrl);
  const sourceHref = safeExternalUrl(post.sourceUrl);
  const dateLabel = formatOpportunityDate(post.publishedAt);

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
      {imageSrc ? (
        <div className="border-b border-brand-100 bg-stone-100">
          <img
            src={imageSrc}
            alt=""
            className="max-h-80 w-full object-contain object-center"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}
      <div className="space-y-2 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {post.sponsor ? (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-brand-800 ring-1 ring-brand-100">
              {post.sponsor}
            </span>
          ) : null}
          {dateLabel ? <time dateTime={post.publishedAt || undefined}>{dateLabel}</time> : null}
        </div>
        <h3 className="font-display text-lg font-semibold text-brand-900">{post.title}</h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{post.body}</p>
        {sourceHref ? (
          <a
            href={sourceHref}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
          >
            View original post
            <IconExternal />
          </a>
        ) : null}
      </div>
    </article>
  );
}
