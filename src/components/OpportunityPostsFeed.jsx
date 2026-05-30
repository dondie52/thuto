import { useEffect, useState } from "react";
import OpportunityPostCard from "./OpportunityPostCard.jsx";
import {
  fetchOpportunityPosts,
  isSupabaseConfigured,
} from "../lib/opportunityPosts.js";

/**
 * @param {{
 *   category: import("../lib/opportunityPosts.js").OpportunityCategory,
 *   emptyTitle?: string,
 *   emptyBody?: string,
 * }}
 */
export default function OpportunityPostsFeed({ category, emptyTitle, emptyBody }) {
  const [posts, setPosts] = useState(/** @type {import("../lib/opportunityPosts.js").OpportunityPost[]} */ ([]));
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

    fetchOpportunityPosts(category)
      .then((rows) => {
        if (!cancelled) setPosts(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load the latest posts. Try again in a moment.");
          setPosts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, configured]);

  if (!configured) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Updates not connected yet</p>
        <p className="mt-1 leading-relaxed">
          When Supabase is configured for this deployment, new announcements will appear here automatically.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading posts">
        {[0, 1].map((key) => (
          <div key={key} className="animate-pulse overflow-hidden rounded-2xl border border-brand-100 bg-white">
            <div className="h-40 bg-stone-100" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-24 rounded bg-stone-200" />
              <div className="h-5 w-3/4 rounded bg-stone-200" />
              <div className="h-3 w-full rounded bg-stone-100" />
              <div className="h-3 w-5/6 rounded bg-stone-100" />
            </div>
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
        <p className="font-semibold text-brand-900">{emptyTitle || "No posts yet"}</p>
        <p className="mt-1 leading-relaxed">{emptyBody || "Check back soon for new announcements."}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <li key={post.id}>
          <OpportunityPostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
