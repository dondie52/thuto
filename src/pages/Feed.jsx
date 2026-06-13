import { useCallback, useEffect, useRef, useState } from "react";
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
import { fetchFollowingSet, toggleFollowUser } from "../lib/feedFollows.js";

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
  const [feedMode, setFeedMode] = useState("for_you");
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState(() => new Set());
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const loadMoreRef = useRef(null);
  const cursorRef = useRef(null);
  const postsRef = useRef(posts);
  const feedModeRef = useRef(feedMode);
  const loadingFeedRef = useRef(false);

  postsRef.current = posts;
  feedModeRef.current = feedMode;
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

  const syncFollowingState = useCallback(async (nextPosts) => {
    const authorIds = nextPosts.map((post) => post.authorId).filter(Boolean);
    setFollowingIds(await fetchFollowingSet(authorIds));
  }, []);

  const loadFeed = useCallback(
    async ({ reset = true } = {}) => {
      if (!reset && loadingFeedRef.current) return;
      loadingFeedRef.current = true;

      if (reset) {
        setIsLoading(true);
        cursorRef.current = null;
      } else {
        setIsLoadingMore(true);
      }
      setError("");
      try {
        const batch = await fetchFeedPosts({
          mode: feedModeRef.current,
          limit: 30,
          cursor: reset ? null : cursorRef.current,
        });
        const currentPosts = postsRef.current;
        const merged = reset
          ? batch
          : [...currentPosts, ...batch.filter((post) => !currentPosts.some((item) => item.id === post.id))];
        setPosts(merged);
        await syncFollowingState(merged);
        setHasMore(batch.length === 30);
        const last = batch[batch.length - 1];
        if (last) {
          cursorRef.current = {
            publishedAt: last.publishedAt || last.createdAt,
            id: last.id,
            feedScore: last.feedScore,
          };
        }
      } catch (err) {
        setError(err.message || "Could not load the feed.");
      } finally {
        loadingFeedRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [syncFollowingState],
  );

  useEffect(() => {
    setPostFeedbackById({});
    setReportedTargetKeys({});
    loadFeed({ reset: true });
  }, [user?.id, feedMode, loadFeed]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || isLoading || isLoadingMore || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadFeed({ reset: false });
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadFeed]);

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
    !profile?.username &&
    !(profile?.onboarding_completed_at || profile?.onboarding_skipped_at);

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
      await loadFeed({ reset: true });
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
      await loadFeed({ reset: true });
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
      await loadFeed({ reset: true });
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
        reason: targetType === "post" ? "irrelevant" : "other",
        details: targetType === "post" ? "Not useful for my feed." : "Reported from the feed screen.",
      });
      markTargetReported(targetType, targetId);
      setPostFeedback(
        postId,
        "notice",
        result.alreadyReported ? "You already reported this item." : "Report sent to admins.",
      );
      await loadFeed({ reset: true });
    } catch (err) {
      setPostFeedback(postId, "error", err.message || "Could not send report.");
    }
  }

  async function handleToggleFollow(post) {
    if (!user) {
      setPostFeedback(post.id, "notice", "Log in to follow people on the feed.");
      return;
    }
    clearPostFeedback(post.id);
    try {
      const nowFollowing = await toggleFollowUser(post.authorId);
      setFollowingIds((current) => {
        const next = new Set(current);
        if (nowFollowing) next.add(post.authorId);
        else next.delete(post.authorId);
        return next;
      });
      await loadFeed({ reset: true });
    } catch (err) {
      setPostFeedback(post.id, "error", err.message || "Could not update follow.");
    }
  }

  return (
    <div className="-mx-4 -my-4 min-h-[calc(100vh-7rem)] bg-gradient-to-b from-brand-50 via-teal-50/80 to-white px-4 py-4 sm:mx-auto sm:my-0 sm:w-full sm:max-w-2xl sm:rounded-[2rem] sm:px-5 sm:py-5">
      <section className="feed-top-bar sticky z-20 -mx-4 mb-4 border-b border-brand-100/80 bg-gradient-to-b from-brand-50 via-teal-50/95 to-teal-50/90 px-4 pb-4 pt-1 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search feed</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/90">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search posts, people, or universities..."
              className="h-12 w-full rounded-full border border-brand-200 bg-brand-700/90 pl-11 pr-4 text-sm font-medium text-white shadow-sm placeholder:text-white/75 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <button
            type="button"
            onClick={() => loadFeed({ reset: true })}
            className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-800 shadow-sm hover:bg-brand-50"
            aria-label="Refresh feed"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8.1 8.1 0 00-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0015.5 2M20 19v-4h-4" />
            </svg>
          </button>
          <Link to="/profile" className="focus-ring shrink-0 rounded-full" aria-label="Open profile">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-800 ring-2 ring-white shadow-sm">
                {profileInitial(composerName)}
              </span>
            )}
          </Link>
        </div>
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
            Add your name and username so classmates recognise you on the feed.
          </p>
          <Link
            to="/onboarding?next=%2Ffeed"
            className="focus-ring mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Complete setup
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

      <section className="mb-4 rounded-[1.35rem] border border-brand-100/80 bg-white p-3 shadow-[0_14px_34px_rgba(15,118,110,0.13)] sm:mb-5 sm:p-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-brand-100"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white ring-1 ring-brand-100">
              {profileInitial(composerName)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <form className="space-y-2.5 sm:space-y-3" onSubmit={handleSubmitPost}>
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowComposerDetails(true)}
                  className="focus-ring min-h-11 min-w-0 flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 text-left text-sm font-medium text-stone-700 shadow-inner hover:bg-white"
                >
                  Start a post
                </button>
                <label className="focus-within:ring-2 focus-within:ring-brand-200 inline-flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-xl px-2 text-xs font-semibold text-brand-800 hover:bg-brand-50">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.75 5.75A1.75 1.75 0 016.5 4h11a1.75 1.75 0 011.75 1.75v12.5A1.75 1.75 0 0117.5 20h-11a1.75 1.75 0 01-1.75-1.75V5.75z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM5 16l4-4 3 3 2-2 5 5" />
                  </svg>
                  Photo
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
                <button
                  type="submit"
                  disabled={!canPublish || isPosting || !form.body.trim()}
                  className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-brand-700 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPosting ? "..." : "Post"}
                </button>
              </div>

              {showComposerDetails ? (
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
                    className="w-full rounded-2xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60 sm:px-4 sm:py-3"
                  />
                </label>
              ) : null}

              {showComposerDetails ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-stone-600">Category</span>
                    <select
                      value={form.category}
                      onChange={(event) => updateForm({ category: event.target.value })}
                      disabled={!canCompose || isPosting}
                      className="mt-1 w-full rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
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
                      className="mt-1 w-full rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-stone-600">Source link optional</span>
                    <input
                      value={form.linkUrl}
                      onChange={(event) => updateForm({ linkUrl: event.target.value })}
                      disabled={!canCompose || isPosting}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
                    />
                  </label>
                </div>
              ) : null}

              {showComposerDetails ? (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowComposerDetails((open) => !open)}
                    className="focus-ring inline-flex min-h-9 items-center justify-center rounded-full border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50"
                  >
                    Hide details
                  </button>
                  {form.files.length ? (
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                      {form.files.length} {form.files.length === 1 ? "photo" : "photos"}
                    </span>
                  ) : null}
                </div>
              ) : null}

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full border border-brand-100 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setFeedMode("for_you")}
              className={[
                "focus-ring rounded-full px-4 py-2 text-sm font-semibold transition",
                feedMode === "for_you" ? "bg-brand-700 text-white" : "text-brand-800 hover:bg-brand-50",
              ].join(" ")}
            >
              For you
            </button>
            <button
              type="button"
              onClick={() => setFeedMode("latest")}
              className={[
                "focus-ring rounded-full px-4 py-2 text-sm font-semibold transition",
                feedMode === "latest" ? "bg-brand-700 text-white" : "text-brand-800 hover:bg-brand-50",
              ].join(" ")}
            >
              Latest
            </button>
          </div>
          <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-500">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>
        {feedMode === "for_you" && user ? (
          <p className="text-sm text-stone-600">
            Ranked for your institutions, interests, and the people you follow.
          </p>
        ) : null}

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
            showRelevance={feedMode === "for_you"}
            isFollowingAuthor={followingIds.has(post.authorId)}
            onToggleFollow={handleToggleFollow}
            onReact={handleReaction}
            onToggleComments={toggleComments}
            onCommentDraftChange={updateCommentDraft}
            onSubmitComment={handleSubmitComment}
            onReport={handleReport}
            actionFeedback={postFeedbackById[post.id] || null}
            reportedTargetKeys={reportedTargetKeys}
          />
        ))}

        {hasMore && posts.length ? (
          <div
            ref={loadMoreRef}
            className="rounded-3xl border border-brand-100 bg-white p-4 text-center text-sm text-stone-500 shadow-sm"
          >
            {isLoadingMore ? "Loading more posts..." : "Scroll for more"}
          </div>
        ) : null}
      </section>
    </div>
  );
}
