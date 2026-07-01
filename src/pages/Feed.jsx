import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import FeedPostCard from "../components/FeedPostCard.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import {
  FEED_CATEGORIES,
  deleteFeedPost,
  fetchFeedPostById,
  fetchFeedPosts,
  isSupabaseConfigured,
  reportFeedTarget,
  setFeedReaction,
  submitFeedComment,
  submitFeedPost,
} from "../lib/feed.js";
import { fetchFollowingSet, toggleFollowUser } from "../lib/feedFollows.js";
import { fetchSavedPostSet, toggleSavedPost } from "../lib/savedPosts.js";

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
  const { registerRefresh } = useOutletContext() || {};
  const [searchParams] = useSearchParams();
  const highlightPostId = (searchParams.get("post") || "").trim();
  const { user, profile, supabaseConfigured, isLoading: isAuthLoading } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState(() => new Set());
  const [savedPostIds, setSavedPostIds] = useState(() => new Set());
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const loadMoreRef = useRef(null);
  const cursorRef = useRef(null);
  const postsRef = useRef(posts);
  const loadingFeedRef = useRef(false);

  postsRef.current = posts;
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
          mode: "for_you",
          limit: 30,
          cursor: reset ? null : cursorRef.current,
        });
        const currentPosts = postsRef.current;
        const merged = reset
          ? batch
          : [...currentPosts, ...batch.filter((post) => !currentPosts.some((item) => item.id === post.id))];
        setPosts(merged);
        await Promise.all([
          syncFollowingState(merged),
          fetchSavedPostSet(merged.map((post) => post.id)).then(setSavedPostIds),
        ]);
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
  }, [user?.id, loadFeed]);

  useEffect(() => {
    if (!registerRefresh) return undefined;
    return registerRefresh(() => loadFeed({ reset: true }));
  }, [loadFeed, registerRefresh]);

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

  useEffect(() => {
    if (!highlightPostId || isLoading) return undefined;

    let cancelled = false;

    async function ensureHighlightedPost() {
      const hasPost = postsRef.current.some((post) => post.id === highlightPostId);
      if (!hasPost) {
        try {
          const post = await fetchFeedPostById(highlightPostId);
          if (post && !cancelled) {
            setPosts((current) => (current.some((item) => item.id === post.id) ? current : [post, ...current]));
          }
        } catch {
          /* ignore missing post */
        }
      }

      window.requestAnimationFrame(() => {
        const node = document.getElementById(`feed-post-${highlightPostId}`);
        if (node) {
          node.scrollIntoView({ behavior: "smooth", block: "center" });
          node.classList.add("ring-2", "ring-brand-400", "ring-offset-2");
          window.setTimeout(() => {
            node.classList.remove("ring-2", "ring-brand-400", "ring-offset-2");
          }, 2400);
        }
      });
    }

    ensureHighlightedPost();
    return () => {
      cancelled = true;
    };
  }, [highlightPostId, isLoading, posts.length]);

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

  async function handleSave(post) {
    if (!user) {
      setPostFeedback(post.id, "notice", "Log in to save posts.");
      return;
    }
    clearPostFeedback(post.id);
    try {
      const saved = await toggleSavedPost(post.id);
      setSavedPostIds((current) => {
        const next = new Set(current);
        if (saved) next.add(post.id);
        else next.delete(post.id);
        return next;
      });
      setPostFeedback(post.id, "notice", saved ? "Post saved." : "Removed from saved posts.");
    } catch (err) {
      setPostFeedback(post.id, "error", err.message || "Could not save post.");
    }
  }

  async function handleDeletePost(post) {
    if (!user) {
      setPostFeedback(post.id, "notice", "Log in to delete posts.");
      return;
    }
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    clearPostFeedback(post.id);
    setError("");
    setNotice("");
    try {
      await deleteFeedPost({ postId: post.id });
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setNotice("Post deleted.");
    } catch (err) {
      setPostFeedback(post.id, "error", err.message || "Could not delete post.");
    }
  }

  return (
    <div>
      {(configured === false ||
        (configured && user && profileIncomplete) ||
        (configured && !isAuthLoading && !user)) && (
        <div className="space-y-2 px-4 pb-2">
      {!configured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Feed needs Supabase environment variables, the scroll-feed migration, and the feed-moderation Edge Function
          before posting and live content work.
        </div>
      ) : null}

      {configured && user && profileIncomplete ? (
        <Link
          to="/onboarding?next=%2Ffeed"
          className="focus-ring block rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-900 hover:bg-brand-100/80"
        >
          Complete your profile
        </Link>
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
        </div>
      )}

      <section className="border-b border-stone-200/70 px-3 py-2">
        <div className="flex min-w-0 items-start gap-2">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-stone-200"
            />
          ) : (
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white ring-1 ring-stone-200">
              {profileInitial(composerName)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <form className="space-y-2" onSubmit={handleSubmitPost}>
              <div className="flex min-w-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowComposerDetails(true)}
                  className="focus-ring min-h-8 min-w-0 flex-1 rounded-full border border-stone-200 bg-stone-50 px-3 text-left text-xs font-medium text-stone-500 hover:border-stone-300 hover:bg-white"
                >
                  Start a post...
                </button>
                <label className="focus-within:ring-1 focus-within:ring-brand-200 inline-flex min-h-8 cursor-pointer flex-col items-center justify-center rounded-lg px-1.5 text-[10px] font-medium text-stone-600 hover:bg-stone-50">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
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
                    onChange={(event) => {
                      updateForm({ files: Array.from(event.target.files || []).slice(0, 4) });
                      setShowComposerDetails(true);
                    }}
                    className="sr-only"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canPublish || isPosting || !form.body.trim()}
                  className="focus-ring inline-flex min-h-8 shrink-0 items-center justify-center rounded-full bg-brand-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs leading-relaxed text-stone-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200 disabled:opacity-60"
                  />
                </label>
              ) : null}

              {showComposerDetails ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Category</span>
                    <select
                      value={form.category}
                      onChange={(event) => updateForm({ category: event.target.value })}
                      disabled={!canCompose || isPosting}
                      className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200 disabled:opacity-60"
                    >
                      {FEED_CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Title optional</span>
                    <input
                      value={form.title}
                      onChange={(event) => updateForm({ title: event.target.value })}
                      maxLength={120}
                      disabled={!canCompose || isPosting}
                      placeholder="Example: BDF scholarship notice"
                      className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200 disabled:opacity-60"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Link optional</span>
                    <input
                      value={form.linkUrl}
                      onChange={(event) => updateForm({ linkUrl: event.target.value })}
                      disabled={!canCompose || isPosting}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200 disabled:opacity-60"
                    />
                  </label>
                </div>
              ) : null}

              {showComposerDetails && form.files.length ? (
                <p className="rounded-lg bg-stone-50 px-2.5 py-1.5 text-[11px] text-stone-600">
                  Attached: {form.files.map((file) => file.name).join(", ")}
                </p>
              ) : null}

              {showComposerDetails ? (
                <button
                  type="button"
                  onClick={() => setShowComposerDetails(false)}
                  className="focus-ring rounded-full px-2.5 py-1 text-[11px] font-medium text-stone-500 hover:bg-stone-100"
                >
                  Hide details
                </button>
              ) : null}

              {notice ? (
                <p className="rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1.5 text-xs text-brand-900" role="status">
                  {notice}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="px-3 py-3 text-center text-xs text-stone-500">Loading posts...</div>
      ) : null}

      {!isLoading && !posts.length ? (
        <div className="px-3 py-6 text-center">
          <p className="text-sm font-semibold text-stone-800">No posts yet</p>
          <p className="mt-1 text-xs text-stone-500">
            {user ? "Be the first to share an update, or check back after you submit one for review." : "Sign in and post the first student update."}
          </p>
        </div>
      ) : null}

      {!isLoading && posts.length ? (
        <section className="divide-y divide-stone-200/80 border-b border-stone-200/80 bg-white">
        {posts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            user={user}
            isOwnPost={Boolean(user?.id && post.authorId === user.id)}
            commentsExpanded={Boolean(expandedComments[post.id])}
            commentDraft={commentDrafts[post.id]}
            isCommentSubmitting={commentSubmittingFor === post.id}
            isFollowingAuthor={followingIds.has(post.authorId)}
            isSaved={savedPostIds.has(post.id)}
            onToggleFollow={handleToggleFollow}
            onReact={handleReaction}
            onToggleComments={toggleComments}
            onCommentDraftChange={updateCommentDraft}
            onSubmitComment={handleSubmitComment}
            onReport={handleReport}
            onSave={handleSave}
            onDelete={handleDeletePost}
            actionFeedback={postFeedbackById[post.id] || null}
            reportedTargetKeys={reportedTargetKeys}
          />
        ))}

        {hasMore ? (
          <div
            ref={loadMoreRef}
            className="py-3 text-center text-xs text-stone-500"
          >
            {isLoadingMore ? "Loading more posts..." : "Scroll for more"}
          </div>
        ) : null}
        </section>
      ) : null}
    </div>
  );
}
