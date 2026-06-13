import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import { searchFeed } from "../lib/feedSearch.js";
import { categoryLabel } from "../lib/feed.js";
import { getOrCreateConversation } from "../lib/messaging.js";

function profileInitial(name) {
  const letter = String(name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function FeedSearch() {
  useDocumentTitle("Search feed | Thuto");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [draft, setDraft] = useState(query);
  const [results, setResults] = useState({ posts: [], people: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(query);
  }, [query]);

  const runSearch = useCallback(async (term) => {
    const value = term.trim();
    if (!value) {
      setResults({ posts: [], people: [] });
      setError("");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      setResults(await searchFeed(value));
    } catch (err) {
      setError(err.message || "Could not search the feed.");
      setResults({ posts: [], people: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  function handleSubmit(event) {
    event.preventDefault();
    const next = draft.trim();
    setSearchParams(next ? { q: next } : {}, { replace: true });
  }

  async function handleMessage(person) {
    if (!user) return;
    try {
      const conversationId = await getOrCreateConversation(person.id);
      navigate(`/feed/messages/${conversationId}`);
    } catch (err) {
      setError(err.message || "Could not open messages.");
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900">Search feed</h1>
        <p className="mt-1 text-sm text-stone-600">Find posts, classmates, and university updates.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-700">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
          </svg>
        </span>
        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search posts, people, or universities..."
          className="focus-ring h-12 w-full rounded-full border border-brand-200 bg-white pl-11 pr-4 text-sm font-medium text-stone-800 shadow-sm placeholder:text-stone-400"
        />
      </form>

      {!user ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          <Link to="/auth?mode=login&next=%2Ffeed%2Fsearch" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to message people you find in search.
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? <p className="text-sm text-stone-500">Searching...</p> : null}

      {!isLoading && query && !results.posts.length && !results.people.length ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-stone-600">
          No matches for &ldquo;{query}&rdquo;.
        </div>
      ) : null}

      {results.people.length ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">People</h2>
          <div className="space-y-2">
            {results.people.map((person) => (
              <div key={person.id} className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 shadow-sm">
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                    {profileInitial(person.fullName)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brand-900">{person.fullName}</p>
                  <p className="truncate text-xs text-stone-500">
                    {person.username ? `@${person.username}` : "Student"}
                    {person.universityLine ? ` · ${person.universityLine}` : ""}
                  </p>
                </div>
                {user && user.id !== person.id ? (
                  <button
                    type="button"
                    onClick={() => handleMessage(person)}
                    className="focus-ring rounded-full bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
                  >
                    Message
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {results.posts.length ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Posts</h2>
          <div className="space-y-2">
            {results.posts.map((post) => (
              <Link
                key={post.id}
                to="/feed"
                className="focus-ring block rounded-2xl border border-brand-100 bg-white p-4 shadow-sm hover:bg-brand-50/40"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                  <span>{categoryLabel(post.category)}</span>
                  <span className="text-stone-400">·</span>
                  <span className="text-stone-500">{formatWhen(post.publishedAt)}</span>
                </div>
                <p className="mt-2 font-semibold text-brand-900">{post.title || post.body.slice(0, 80)}</p>
                <p className="mt-1 line-clamp-2 text-sm text-stone-600">{post.body}</p>
                <p className="mt-2 text-xs text-stone-500">
                  by {post.authorDisplayName}
                  {post.authorUsername ? ` (@${post.authorUsername})` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
