import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ExpandableText from "./ExpandableText.jsx";
import { categoryLabel, fetchFeedPostsByCategory, isSupabaseConfigured } from "../lib/feed.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * @param {{
 *   category: string,
 *   emptyTitle?: string,
 *   emptyBody?: string,
 *   limit?: number,
 * }}
 */
export default function FeedCategoryPosts({ category, emptyTitle, emptyBody, limit = 12 }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      setPosts([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetchFeedPostsByCategory(category, { limit })
      .then((rows) => {
        if (!cancelled) setPosts(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load the latest updates. Try again in a moment.");
          setPosts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, configured, limit]);

  if (!configured) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Updates not connected yet</p>
        <p className="mt-1 leading-relaxed">
          When Supabase is configured for this deployment, scholarship updates from the feed will appear here.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading updates">
        {[0, 1].map((key) => (
          <div key={key} className="animate-pulse rounded-2xl border border-brand-100 bg-white p-4">
            <div className="h-3 w-24 rounded bg-stone-200" />
            <div className="mt-3 h-5 w-3/4 rounded bg-stone-200" />
            <div className="mt-2 h-3 w-full rounded bg-stone-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
        {error}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4 text-sm text-slate-600">
        <p className="font-semibold text-brand-900">{emptyTitle || "No updates yet"}</p>
        <p className="mt-1 leading-relaxed">{emptyBody || "Check back soon or browse the feed for other student updates."}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {posts.map((post) => {
        const linkHref = safeExternalUrl(post.linkUrl);
        return (
          <li key={post.id}>
            <article className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-brand-800 ring-1 ring-brand-100">
                  {categoryLabel(post.category)}
                </span>
                {post.publishedAt ? <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> : null}
              </div>
              {post.title ? <h3 className="mt-2 font-display text-lg font-semibold text-brand-900">{post.title}</h3> : null}
              {post.body ? (
                <ExpandableText text={post.body} preserveWrap className="mt-2 text-sm leading-relaxed text-slate-600" />
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link
                  to={`/feed?post=${post.id}`}
                  className="focus-ring font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
                >
                  Open in feed
                </Link>
                {linkHref ? (
                  <a
                    href={linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
                  >
                    Official link
                  </a>
                ) : null}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
