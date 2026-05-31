import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FeedPostCard from "../components/FeedPostCard.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import {
  FEED_CATEGORIES,
  fetchFeedPosts,
  isSupabaseConfigured,
  reportFeedTarget,
  setFeedReaction,
  submitFeedComment,
  submitFeedPost,
} from "../lib/feed.js";

function publishMessage(status) {
  if (status === "published") return "Posted live. Your update is on the feed.";
  if (status === "rejected") return "Not published. AI rejected it for safety or relevance.";
  if (status === "pending_ai") return "Submitted. AI moderation is still processing your post.";
  return "Submitted for admin review. You can see it below while it waits for approval.";
}

export default function Feed() {
  useDocumentTitle("Social Feed | Thuto");
  const { user, supabaseConfigured, isLoading: isAuthLoading } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [commentSubmittingFor, setCommentSubmittingFor] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const commentInputRefs = useRef({});
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

  function toggleComments(postId, { focusReply = false } = {}) {
    setExpandedComments((current) => {
      const nextOpen = focusReply ? true : !current[postId];
      return { ...current, [postId]: nextOpen };
    });
    if (focusReply) {
      window.requestAnimationFrame(() => {
        commentInputRefs.current[postId]?.focus();
      });
    }
  }

  function setCommentInputRef(postId, node) {
    if (node) commentInputRefs.current[postId] = node;
    else delete commentInputRefs.current[postId];
  }

  const canCompose = configured && !isAuthLoading;
  const canPublish = canCompose && Boolean(user);

  async function handleSubmitPost(event) {
    event.preventDefault();
    if (!configured) {
      setError("Feed posting is not set up on this build yet.");
      return;
    }
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
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">Social Feed</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-teal-50/90 sm:text-base">
          Share opportunities, campus stories, questions, study tips and deadlines.
        </p>
      </section>

      {!configured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Feed needs Supabase environment variables, the scroll-feed migration, and the feed-moderation Edge Function
          before posting and live content work.
        </div>
      ) : null}

      {configured && !isAuthLoading && !user ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-relaxed text-brand-900">
          <p className="font-semibold">Sign in to publish</p>
          <p className="mt-1 text-brand-800/90">
            You can draft a post below, then log in to submit it to the feed.
          </p>
          <Link
            to="/auth?mode=login"
            className="focus-ring mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Log in to post
          </Link>
        </div>
      ) : null}

      <section className="rounded-3xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-900">Add a post</h2>
          </div>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmitPost}>
          <div className="grid gap-3 sm:grid-cols-[11rem_1fr]">
            <label className="block">
              <span className="text-xs font-semibold text-stone-600">Category</span>
              <select
                value={form.category}
                onChange={(event) => updateForm({ category: event.target.value })}
                disabled={!canCompose || isPosting}
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
                disabled={!canCompose || isPosting}
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
              disabled={!canCompose || isPosting}
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
                disabled={!canCompose || isPosting}
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
                disabled={!canCompose || isPosting}
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

          <button
            type="submit"
            disabled={!canPublish || isPosting || !form.body.trim()}
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPosting ? "Submitting..." : user ? "Post to feed" : "Log in to post"}
          </button>
        </form>
      </section>

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
            <p className="font-display text-xl font-semibold text-brand-900">No posts yet</p>
            <p className="mt-2 text-sm text-stone-600">
              {user ? "Be the first to share an update, or check back after you submit one for review." : "Sign in and post the first student update."}
            </p>
          </div>
        ) : null}

        {posts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            user={user}
            isOwnPost={Boolean(user?.id && post.authorId === user.id)}
            commentsExpanded={Boolean(expandedComments[post.id])}
            commentDraft={commentDrafts[post.id]}
            isCommentSubmitting={commentSubmittingFor === post.id}
            commentInputRef={(node) => setCommentInputRef(post.id, node)}
            onReact={handleReaction}
            onToggleComments={toggleComments}
            onCommentDraftChange={updateCommentDraft}
            onSubmitComment={handleSubmitComment}
            onReport={handleReport}
          />
        ))}
      </section>
    </div>
  );
}
