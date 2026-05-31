import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import { safeExternalUrl } from "../lib/urlSafety.js";
import {
  FEED_CATEGORIES,
  FEED_REACTIONS,
  categoryLabel,
  fetchFeedPosts,
  isSupabaseConfigured,
  reportFeedTarget,
  setFeedReaction,
  submitFeedComment,
  submitFeedPost,
} from "../lib/feed.js";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function publishMessage(status) {
  if (status === "published") return "Posted live. AI approved it for the feed.";
  if (status === "rejected") return "Not published. AI rejected it for safety or relevance.";
  return "Sent to admin review. It will stay hidden until approved.";
}

function FeedImages({ images }) {
  if (!images?.length) return null;
  return (
    <div className={`mt-4 grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {images.map((image) => (
        <a
          key={image.id || image.publicUrl}
          href={image.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group overflow-hidden rounded-2xl border border-stone-200 bg-stone-100"
        >
          <img
            src={image.publicUrl}
            alt={image.altText || "Feed attachment"}
            className="aspect-[4/3] h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
}

function ReactionBar({ post, disabled, onReact }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FEED_REACTIONS.map((reaction) => {
        const active = post.viewerReaction === reaction.value;
        const count = post.reactionCounts?.[reaction.value] || 0;
        return (
          <button
            key={reaction.value}
            type="button"
            disabled={disabled}
            onClick={() => onReact(post, reaction.value)}
            className={[
              "focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-brand-100 bg-white text-brand-800 hover:bg-brand-50",
              disabled ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
          >
            {reaction.shortLabel}
            {count ? <span className="ml-1 opacity-80">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function CommentList({ post, user, draft, isSubmitting, onDraftChange, onSubmitComment, onReport }) {
  return (
    <div className="mt-4 border-t border-stone-100 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Comments {post.comments.length ? `(${post.comments.length})` : ""}
        </p>
        <button
          type="button"
          onClick={() => onReport("post", post.id)}
          className="text-xs font-semibold text-stone-500 underline hover:text-red-700"
        >
          Report post
        </button>
      </div>

      {post.comments.length ? (
        <ul className="mt-3 space-y-2">
          {post.comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl bg-stone-50 px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-brand-900">{comment.authorDisplayName}</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-700">{comment.body}</p>
                  <p className="mt-1 text-[11px] text-stone-400">{formatDate(comment.publishedAt || comment.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onReport("comment", comment.id)}
                  className="shrink-0 text-[11px] font-semibold text-stone-400 underline hover:text-red-700"
                >
                  Report
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-2xl bg-stone-50 px-3 py-3 text-sm text-stone-500">No comments yet.</p>
      )}

      {user ? (
        <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={(event) => onSubmitComment(event, post.id)}>
          <input
            value={draft || ""}
            onChange={(event) => onDraftChange(post.id, event.target.value)}
            maxLength={1000}
            placeholder="Add a useful comment..."
            className="min-h-11 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="submit"
            disabled={isSubmitting || !String(draft || "").trim()}
            className="focus-ring rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Comment
          </button>
        </form>
      ) : (
        <p className="mt-3 text-xs text-stone-500">
          <Link to="/auth?mode=login" className="font-semibold text-brand-700 underline">
            Log in
          </Link>{" "}
          to comment or react.
        </p>
      )}
    </div>
  );
}

export default function Feed() {
  useDocumentTitle("Scroll Feed | Thuto");
  const { user, supabaseConfigured } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [commentSubmittingFor, setCommentSubmittingFor] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [fileInputKey, setFileInputKey] = useState(0);
  const [form, setForm] = useState({
    category: "general",
    title: "",
    body: "",
    linkUrl: "",
    files: [],
  });

  async function loadFeed() {
    setIsLoading(true);
    setError("");
    try {
      setPosts(await fetchFeedPosts());
    } catch (err) {
      setError(err.message || "Could not load the feed.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFeed();
  }, [user?.id]);

  function updateForm(patch) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function updateCommentDraft(postId, value) {
    setCommentDrafts((current) => ({ ...current, [postId]: value }));
  }

  async function handleSubmitPost(event) {
    event.preventDefault();
    if (!user) {
      setNotice("Log in before posting to the feed.");
      return;
    }
    setIsPosting(true);
    setError("");
    setNotice("");
    try {
      const result = await submitFeedPost({
        category: form.category,
        title: form.title,
        body: form.body,
        linkUrl: form.linkUrl,
        imageFiles: form.files,
      });
      setNotice(publishMessage(result.post?.status));
      setForm({ category: "general", title: "", body: "", linkUrl: "", files: [] });
      setFileInputKey((key) => key + 1);
      await loadFeed();
    } catch (err) {
      setError(err.message || "Could not submit post.");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleReaction(post, reaction) {
    if (!user) {
      setNotice("Log in to react to feed posts.");
      return;
    }
    setError("");
    try {
      await setFeedReaction({
        postId: post.id,
        reaction: post.viewerReaction === reaction ? null : reaction,
      });
      await loadFeed();
    } catch (err) {
      setError(err.message || "Could not update reaction.");
    }
  }

  async function handleSubmitComment(event, postId) {
    event.preventDefault();
    const body = String(commentDrafts[postId] || "").trim();
    if (!body) return;
    setCommentSubmittingFor(postId);
    setError("");
    setNotice("");
    try {
      const result = await submitFeedComment({ postId, body });
      setNotice(publishMessage(result.comment?.status));
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      await loadFeed();
    } catch (err) {
      setError(err.message || "Could not submit comment.");
    } finally {
      setCommentSubmittingFor("");
    }
  }

  async function handleReport(targetType, targetId) {
    if (!user) {
      setNotice("Log in to report feed content.");
      return;
    }
    setError("");
    try {
      const result = await reportFeedTarget({
        targetType,
        targetId,
        reason: "other",
        details: "Reported from the feed screen.",
      });
      setNotice(result.alreadyReported ? "You already reported this item." : "Report sent to admins.");
    } catch (err) {
      setError(err.message || "Could not send report.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-brand-700/20 bg-gradient-to-br from-[#0c5f58] via-brand-700 to-[#102f2b] p-5 text-white shadow-card sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-teal-200/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">Scroll Feed</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Useful student updates, kept clean.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-teal-50/90">
          Share opportunities, campus stories, questions, notices, study tips, and deadlines. AI checks posts first,
          then admins can take down anything that should not be here.
        </p>
      </section>

      {!configured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Feed needs Supabase environment variables, the scroll-feed migration, and the feed-moderation Edge Function
          before posting and live content work.
        </div>
      ) : null}

      <section className="rounded-3xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-900">Post something useful</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Broad social is allowed, but it must still be student-relevant and safe.
            </p>
          </div>
          {!user ? (
            <Link
              to="/auth?mode=login"
              className="focus-ring rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-100"
            >
              Log in to post
            </Link>
          ) : null}
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmitPost}>
          <div className="grid gap-3 sm:grid-cols-[11rem_1fr]">
            <label className="block">
              <span className="text-xs font-semibold text-stone-600">Category</span>
              <select
                value={form.category}
                onChange={(event) => updateForm({ category: event.target.value })}
                disabled={!configured || !user || isPosting}
                className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
              >
                {FEED_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-stone-600">Title optional</span>
              <input
                value={form.title}
                onChange={(event) => updateForm({ title: event.target.value })}
                maxLength={120}
                disabled={!configured || !user || isPosting}
                placeholder="Example: BDF scholarship notice"
                className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-stone-600">Post</span>
            <textarea
              value={form.body}
              onChange={(event) => updateForm({ body: event.target.value })}
              maxLength={2400}
              rows={5}
              required
              disabled={!configured || !user || isPosting}
              placeholder="Write the update, question, opportunity, or useful notice..."
              className="mt-1 w-full rounded-2xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-stone-600">Source link optional</span>
              <input
                value={form.linkUrl}
                onChange={(event) => updateForm({ linkUrl: event.target.value })}
                disabled={!configured || !user || isPosting}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-stone-600">Images optional, max 4</span>
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                multiple
                disabled={!configured || !user || isPosting}
                onChange={(event) => updateForm({ files: Array.from(event.target.files || []).slice(0, 4) })}
                className="mt-1 block w-full text-sm text-stone-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-800 hover:file:bg-brand-100 disabled:opacity-60"
              />
            </label>
          </div>

          {form.files.length ? (
            <p className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
              Attached: {form.files.map((file) => file.name).join(", ")}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!configured || !user || isPosting || !form.body.trim()}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPosting ? "Checking with AI..." : "Submit to feed"}
          </button>
        </form>
      </section>

      {notice ? (
        <p className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-brand-900">Latest posts</h2>
          <button
            type="button"
            onClick={loadFeed}
            className="focus-ring rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-brand-100 bg-white p-6 text-sm text-stone-500 shadow-sm">
            Loading the feed...
          </div>
        ) : null}

        {!isLoading && !posts.length ? (
          <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/60 p-8 text-center">
            <p className="font-display text-xl font-semibold text-brand-900">No live posts yet</p>
            <p className="mt-2 text-sm text-stone-600">The first safe, approved update will appear here.</p>
          </div>
        ) : null}

        {posts.map((post) => {
          const linkUrl = safeExternalUrl(post.linkUrl);
          return (
            <article key={post.id} className="rounded-3xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                    {categoryLabel(post.category)}
                  </span>
                  <p className="mt-3 text-sm font-semibold text-brand-950">{post.authorDisplayName}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{formatDate(post.publishedAt || post.createdAt)}</p>
                </div>
                {post.reportCount ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    {post.reportCount} report{post.reportCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              {post.title ? <h3 className="mt-4 font-display text-xl font-semibold text-brand-950">{post.title}</h3> : null}
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">{post.body}</p>

              {linkUrl ? (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex break-all rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 underline"
                >
                  Open source link
                </a>
              ) : null}

              <FeedImages images={post.images} />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <ReactionBar post={post} disabled={!user} onReact={handleReaction} />
              </div>

              <CommentList
                post={post}
                user={user}
                draft={commentDrafts[post.id]}
                isSubmitting={commentSubmittingFor === post.id}
                onDraftChange={updateCommentDraft}
                onSubmitComment={handleSubmitComment}
                onReport={handleReport}
              />
            </article>
          );
        })}
      </section>
    </div>
  );
}
