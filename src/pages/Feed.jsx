import { useEffect, useState } from "react";
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

function profileInitial(name) {
  const letter = String(name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

function publishMessage(status) {
  if (status === "published") return "Posted live. Your update is on the feed.";
  if (status === "rejected") return "Not published. AI rejected it for safety or relevance.";
  if (status === "pending_ai") return "Submitted. AI moderation is still processing your post.";
  return "Submitted for admin review. You can see it below while it waits for approval.";
}

export default function Feed() {
  useDocumentTitle("Social Feed | Thuto");
  const { user, profile, supabaseConfigured, isLoading: isAuthLoading } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [commentSubmittingFor, setCommentSubmittingFor] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [postFeedbackById, setPostFeedbackById] = useState({});
  const [reportedTargetKeys, setReportedTargetKeys] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [showComposerDetails, setShowComposerDetails] = useState(false);
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
    setPostFeedbackById({});
    setReportedTargetKeys({});
    loadFeed();
  }, [user?.id]);

  function updateForm(patch) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function updateCommentDraft(postId, value) {
    setCommentDrafts((current) => ({ ...current, [postId]: value }));
  }

  function setPostFeedback(postId, tone, message) {
    setPostFeedbackById((current) => ({
      ...current,
      [postId]: { tone, message },
    }));
  }

  function clearPostFeedback(postId) {
    setPostFeedbackById((current) => {
      if (!current[postId]) return current;
      const next = { ...current };
      delete next[postId];
      return next;
    });
  }

  function markTargetReported(targetType, targetId) {
    setReportedTargetKeys((current) => ({
      ...current,
      [`${targetType}:${targetId}`]: true,
    }));
  }

  function toggleComments(postId) {
    setExpandedComments((current) => ({ ...current, [postId]: !current[postId] }));
  }

  const canCompose = configured && !isAuthLoading;
  const canPublish = canCompose && Boolean(user);
  const composerName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    "Student";
  const profileIncomplete =
    Boolean(user) &&
    !(
      profile?.avatar_url ||
      profile?.university_name ||
      profile?.distinction
    );

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
      setShowComposerDetails(false);
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
      setPostFeedback(post.id, "notice", "Log in to react to feed posts.");
      return;
    }
    clearPostFeedback(post.id);
    try {
      await setFeedReaction({
        postId: post.id,
        reaction: post.viewerReaction === reaction ? null : reaction,
      });
      await loadFeed();
    } catch (err) {
      setPostFeedback(post.id, "error", err.message || "Could not update reaction.");
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

  async function handleReport({ postId, targetType, targetId }) {
    if (!user) {
      setPostFeedback(postId, "notice", "Log in to report feed content.");
      return;
    }
    clearPostFeedback(postId);
    try {
      const result = await reportFeedTarget({
        targetType,
        targetId,
        reason: "other",
        details: "Reported from the feed screen.",
      });
      markTargetReported(targetType, targetId);
      setPostFeedback(
        postId,
        "notice",
        result.alreadyReported ? "You already reported this item." : "Report sent to admins.",
      );
      await loadFeed();
    } catch (err) {
      setPostFeedback(postId, "error", err.message || "Could not send report.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-8 sm:space-y-5 sm:pb-0">
      <section className="rounded-2xl border border-brand-100 bg-[var(--thuto-surface-elevated)] p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Social Feed</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-brand-900">Campus updates</h1>
          </div>
          <button
            type="button"
            onClick={loadFeed}
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            Refresh
          </button>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
          Share opportunities, campus stories, questions, study tips, and deadlines.
        </p>
      </section>

      {!configured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Feed needs Supabase environment variables, the scroll-feed migration, and the feed-moderation Edge Function
          before posting and live content work.
        </div>
      ) : null}

      {configured && user && profileIncomplete ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-relaxed text-brand-900">
          <p className="font-semibold">Complete your profile</p>
          <p className="mt-1 text-brand-800/90">
            Add a photo, university, and distinction so classmates recognise you on the feed.
          </p>
          <Link
            to="/profile"
            className="focus-ring mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Edit profile
          </Link>
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

      <section className="rounded-2xl border border-brand-100 bg-white p-3 shadow-card sm:p-5">
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-brand-100 sm:h-11 sm:w-11"
            />
          ) : (
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 ring-1 ring-brand-100 sm:h-11 sm:w-11">
              {profileInitial(composerName)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-brand-900">Create post</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-500 sm:text-sm">
                  {user ? `Posting as ${composerName}. Keep it useful for applicants and students.` : "Draft a post in a smaller, quicker composer."}
                </p>
              </div>
              <label className="min-w-0 text-xs font-semibold text-stone-600 sm:min-w-[10rem]">
                Category
                <select
                  value={form.category}
                  onChange={(event) => updateForm({ category: event.target.value })}
                  disabled={!canCompose || isPosting}
                  className="mt-1 w-full rounded-xl border border-brand-100 bg-[var(--thuto-surface-elevated)] px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
                >
                  {FEED_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <form className="mt-2.5 space-y-2.5 sm:mt-3 sm:space-y-3" onSubmit={handleSubmitPost}>
              <label className="block">
                <span className="sr-only">Post</span>
                <textarea
                  value={form.body}
                  onChange={(event) => updateForm({ body: event.target.value })}
                  maxLength={2400}
                  rows={3}
                  required
                  disabled={!canCompose || isPosting}
                  placeholder="What do you want to share?"
                  className="w-full rounded-2xl border border-brand-100 bg-[var(--thuto-surface-elevated)] px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60 sm:px-4 sm:py-3"
                />
              </label>

              {showComposerDetails ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-stone-600">Title optional</span>
                    <input
                      value={form.title}
                      onChange={(event) => updateForm({ title: event.target.value })}
                      maxLength={120}
                      disabled={!canCompose || isPosting}
                      placeholder="Example: BDF scholarship notice"
                      className="mt-1 w-full rounded-xl border border-brand-100 bg-[var(--thuto-surface-elevated)] px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-stone-600">Source link optional</span>
                    <input
                      value={form.linkUrl}
                      onChange={(event) => updateForm({ linkUrl: event.target.value })}
                      disabled={!canCompose || isPosting}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-xl border border-brand-100 bg-[var(--thuto-surface-elevated)] px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
                    />
                  </label>
                </div>
              ) : null}

              <div className="grid gap-2 rounded-2xl border border-stone-100 bg-stone-50/80 px-2.5 py-2 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:px-3 sm:py-2.5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowComposerDetails((open) => !open)}
                    className="focus-ring inline-flex min-h-9 items-center justify-center rounded-full border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                  >
                    {showComposerDetails ? "Hide details" : "Add details"}
                  </button>
                  <label className="focus-within:ring-2 focus-within:ring-brand-200 inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50">
                    Photos
                    <input
                      key={fileInputKey}
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={!canCompose || isPosting}
                      onChange={(event) => updateForm({ files: Array.from(event.target.files || []).slice(0, 4) })}
                      className="sr-only"
                    />
                  </label>
                  {form.files.length ? (
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                      {form.files.length} {form.files.length === 1 ? "photo" : "photos"}
                    </span>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={!canPublish || isPosting || !form.body.trim()}
                  className="focus-ring inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isPosting ? "Submitting..." : user ? "Post" : "Log in to post"}
                </button>
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
            </form>
          </div>
        </div>
      </section>

      <section className="space-y-3 pt-1 sm:space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-brand-900">Latest posts</h2>
          <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-500">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
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
            onReact={handleReaction}
            onToggleComments={toggleComments}
            onCommentDraftChange={updateCommentDraft}
            onSubmitComment={handleSubmitComment}
            onReport={handleReport}
            actionFeedback={postFeedbackById[post.id] || null}
            reportedTargetKeys={reportedTargetKeys}
          />
        ))}
      </section>
    </div>
  );
}
