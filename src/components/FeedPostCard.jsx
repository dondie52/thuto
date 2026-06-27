import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ExpandableText from "./ExpandableText.jsx";
import UserDisplayName from "./UserDisplayName.jsx";
import { categoryLabel, FEED_REACTIONS, FEED_STATUS_LABELS, shareFeedPostUrl } from "../lib/feed.js";
import { profilePath } from "../lib/profileLinks.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

const OFFICIAL_DISPLAY_NAME = "Thuto Admin";
const LONG_PRESS_MS = 420;

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function categoryBadgeText(category) {
  return categoryLabel(category).toUpperCase();
}

function postStatusLabel(status) {
  return FEED_STATUS_LABELS[status] || status;
}

function avatarInitial(displayName) {
  const letter = String(displayName || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

function targetKey(targetType, targetId) {
  return `${targetType}:${targetId}`;
}

function feedbackClassName(tone) {
  if (tone === "error") return "border border-red-200 bg-red-50 text-red-800";
  return "border border-brand-100 bg-brand-50 text-brand-900";
}

function IconHeart({ filled, className = "h-4 w-4" }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );
}

function IconComment({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function IconShare({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l10-10M17 7H9m8 0v8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 10.5v7a1.5 1.5 0 001.5 1.5h7" />
    </svg>
  );
}

function IconSave({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 4.75A1.75 1.75 0 018.25 3h7.5a1.75 1.75 0 011.75 1.75V21l-5.5-3.5L6.5 21V4.75z" />
    </svg>
  );
}

function renderHashtagText(text) {
  return String(text || "")
    .split(/(#[\p{L}\p{N}_-]+)/gu)
    .map((part, index) =>
      part.startsWith("#") ? (
        <span key={`${part}-${index}`} className="font-semibold text-brand-700">
          {part}
        </span>
      ) : (
        part
      ),
    );
}

function PostAvatar({ isOfficial, displayName, avatarUrl }) {
  if (isOfficial) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-900 text-xl font-bold text-white ring-2 ring-white">
        T
      </div>
    );
  }
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-800 ring-2 ring-white"
      aria-hidden
    >
      {avatarInitial(displayName)}
    </div>
  );
}

function OfficialBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-brand-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      Official
    </span>
  );
}

function PostImages({ images }) {
  const visible = (images || []).filter((image) => image?.publicUrl);
  if (!visible.length) return null;

  if (visible.length === 1) {
    const primary = visible[0];
    return (
      <a
        href={primary.publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block w-full overflow-hidden bg-stone-100"
      >
        <img
          src={primary.publicUrl}
          alt={primary.altText || "Post image"}
          className="h-auto max-h-[28rem] w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </a>
    );
  }

  return (
    <div className={`mt-4 grid gap-0.5 ${visible.length >= 3 ? "grid-cols-2" : "grid-cols-2"}`}>
      {visible.map((image, index) => (
        <a
          key={image.id || image.publicUrl}
          href={image.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={[
            "block w-full overflow-hidden bg-stone-100",
            visible.length === 3 && index === 0 ? "col-span-2" : "",
          ].join(" ")}
        >
          <img
            src={image.publicUrl}
            alt={image.altText || "Post image"}
            className="aspect-[4/3] h-auto w-full object-cover sm:aspect-[16/10]"
            loading="lazy"
            decoding="async"
          />
        </a>
      ))}
    </div>
  );
}

function InlineActionFeedback({ feedback, className = "mt-3" }) {
  if (!feedback?.message) return null;

  return (
    <p
      className={`${className} rounded-xl px-3 py-2 text-sm ${feedbackClassName(feedback.tone)}`}
      role={feedback.tone === "error" ? "alert" : "status"}
    >
      {feedback.message}
    </p>
  );
}

function CommentSection({
  post,
  user,
  draft,
  isSubmitting,
  actionFeedback,
  onDraftChange,
  onSubmitComment,
  onReport,
  reportedTargetKeys,
}) {
  const postReported = Boolean(reportedTargetKeys?.[targetKey("post", post.id)]);

  return (
    <div className="mt-4 border-t border-stone-200/80 px-4 pb-4 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Comments</p>
        <button
          type="button"
          onClick={() => onReport({ postId: post.id, targetType: "post", targetId: post.id })}
          disabled={postReported}
          className={[
            "text-xs font-semibold underline",
            postReported ? "cursor-default text-brand-700 decoration-brand-300" : "text-stone-500 hover:text-red-700",
          ].join(" ")}
        >
          {postReported ? "Reported" : "Report"}
        </button>
      </div>

      <InlineActionFeedback feedback={actionFeedback} />

      {post.comments.length ? (
        <ul className="mt-3 space-y-2">
          {post.comments.map((comment) => {
            const commentReported = Boolean(reportedTargetKeys?.[targetKey("comment", comment.id)]);

            return (
              <li key={comment.id} className="rounded-xl bg-stone-50 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="inline-flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-semibold text-brand-900">
                      <UserDisplayName name={comment.authorDisplayName} isPro={comment.authorIsPro} badgeClassName="size-4" />
                      {comment.authorUsername ? (
                        <span className="font-medium text-stone-500">@{comment.authorUsername}</span>
                      ) : null}
                    </p>
                    {comment.authorDistinction ? (
                      <p className="break-words text-[11px] font-medium text-brand-800/80">{comment.authorDistinction}</p>
                    ) : null}
                    <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-stone-700">{comment.body}</p>
                    <p className="mt-1 text-[11px] text-stone-400">
                      {formatRelativeTime(comment.publishedAt || comment.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReport({ postId: post.id, targetType: "comment", targetId: comment.id })}
                    disabled={commentReported}
                    className={[
                      "shrink-0 text-[11px] font-semibold underline",
                      commentReported
                        ? "cursor-default text-brand-700 decoration-brand-300"
                        : "text-stone-400 hover:text-red-700",
                    ].join(" ")}
                  >
                    {commentReported ? "Reported" : "Report"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl bg-stone-50 px-3 py-3 text-sm text-stone-500">No comments yet.</p>
      )}

      {user ? (
        <form className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => onSubmitComment(event, post.id)}>
          <input
            value={draft || ""}
            onChange={(event) => onDraftChange(post.id, event.target.value)}
            maxLength={1000}
            placeholder="Write a reply..."
            className="min-h-11 min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="submit"
            disabled={isSubmitting || !String(draft || "").trim()}
            className="focus-ring min-h-10 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reply
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

/**
 * Minimal informative feed post card.
 *
 * @param {{
 *   post: object,
 *   user: import("@supabase/supabase-js").User | null,
 *   isOwnPost?: boolean,
 *   commentsExpanded?: boolean,
 *   commentDraft?: string,
 *   isCommentSubmitting?: boolean,
 *   actionFeedback?: { tone: string, message: string } | null,
 *   reportedTargetKeys?: Record<string, boolean>,
 *   onReact: (post: object, reaction: string) => void,
 *   onToggleComments: (postId: string) => void,
 *   onCommentDraftChange: (postId: string, value: string) => void,
 *   onSubmitComment: (event: import("react").FormEvent, postId: string) => void,
 *   onReport: (params: { postId: string, targetType: string, targetId: string }) => void,
 *   isFollowingAuthor?: boolean,
 *   onToggleFollow?: (post: object) => void,
 *   isSaved?: boolean,
 *   onSave?: (post: object) => void,
 * }} props
 */
export default function FeedPostCard({
  post,
  user,
  isOwnPost = false,
  commentsExpanded = false,
  commentDraft = "",
  isCommentSubmitting = false,
  actionFeedback = null,
  reportedTargetKeys = {},
  isFollowingAuthor = false,
  onToggleFollow,
  isSaved = false,
  onSave,
  onReact,
  onToggleComments,
  onCommentDraftChange,
  onSubmitComment,
  onReport,
}) {
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const reactionPickerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const suppressNextLikeClickRef = useRef(false);
  const linkUrl = safeExternalUrl(post.linkUrl);
  const isPublished = post.status === "published";
  const isOfficial = Boolean(post.isOfficial);
  const displayName = isOfficial ? OFFICIAL_DISPLAY_NAME : post.authorDisplayName;
  const timeLabel = formatRelativeTime(post.publishedAt || post.createdAt);
  const commentCount = post.comments?.length || 0;
  const reactionOptions = FEED_REACTIONS.map((reaction) => ({
    ...reaction,
    count: Number(post.reactionCounts?.[reaction.value] || 0),
    active: post.viewerReaction === reaction.value,
  }));
  const activeReaction = reactionOptions.find((reaction) => reaction.active) || null;
  const primaryReactionCount = activeReaction ? activeReaction.count : Number(post.reactionCounts?.like || 0);
  const visibleReactionCounts = reactionOptions.filter((reaction) => reaction.count > 0);
  const reactButtonLabel = activeReaction ? activeReaction.shortLabel : "Like";
  const reactButtonActive = Boolean(activeReaction);

  useEffect(() => {
    if (!reactionPickerOpen) return undefined;

    function handlePointerDown(event) {
      if (!reactionPickerRef.current?.contains(event.target)) {
        setReactionPickerOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setReactionPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [reactionPickerOpen]);

  useEffect(
    () => () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    },
    [],
  );

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function startLongPress() {
    if (!user) return;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      suppressNextLikeClickRef.current = true;
      setReactionPickerOpen(true);
    }, LONG_PRESS_MS);
  }

  function handleLikeButtonClick() {
    if (suppressNextLikeClickRef.current) {
      suppressNextLikeClickRef.current = false;
      return;
    }
    setReactionPickerOpen(false);
    onReact(post, "like");
  }

  function handleReactionSelect(reaction) {
    clearLongPressTimer();
    setReactionPickerOpen(false);
    onReact(post, reaction);
  }

  async function handleShare() {
    const url = await shareFeedPostUrl(post.id);
    const title = post.title || `${displayName} on Thuto`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: post.body.slice(0, 120), url });
        return;
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const authorProfilePath = !isOfficial && post.authorUsername ? profilePath(post.authorUsername) : null;

  return (
    <article
      id={`feed-post-${post.id}`}
      className={[
        "min-w-0 overflow-hidden",
        !isPublished && isOwnPost ? "bg-amber-50/40" : "",
      ].join(" ")}
    >
      <header className="flex min-w-0 items-start gap-3 px-4 pb-0 pt-4">
        {authorProfilePath ? (
          <Link to={authorProfilePath} className="focus-ring shrink-0 rounded-full">
            <PostAvatar isOfficial={isOfficial} displayName={displayName} avatarUrl={post.authorAvatarUrl} />
          </Link>
        ) : (
          <PostAvatar isOfficial={isOfficial} displayName={displayName} avatarUrl={post.authorAvatarUrl} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                  {authorProfilePath ? (
                    <Link to={authorProfilePath} className="focus-ring min-w-0 break-words text-base font-extrabold text-brand-950 hover:underline">
                      <UserDisplayName
                        name={displayName}
                        isPro={post.authorIsPro && !isOfficial}
                        className="min-w-0"
                        nameClassName="break-words"
                      />
                    </Link>
                  ) : (
                    <h3 className="min-w-0 break-words text-base font-extrabold text-brand-950">
                      <UserDisplayName
                        name={displayName}
                        isPro={post.authorIsPro && !isOfficial}
                        className="min-w-0"
                        nameClassName="break-words"
                      />
                    </h3>
                  )}
                </span>
                {isOfficial ? <OfficialBadge /> : null}
                {!isPublished && isOwnPost ? (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                    {postStatusLabel(post.status)}
                  </span>
                ) : null}
              </div>
              {post.authorDistinction ? (
                <p className="mt-0.5 break-words text-xs font-medium text-brand-800/90">{post.authorDistinction}</p>
              ) : null}
              {timeLabel ? <p className="mt-0.5 text-xs text-stone-500">{timeLabel}</p> : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="max-w-full rounded-full bg-brand-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                {categoryBadgeText(post.category)}
              </span>
              {user && !isOwnPost && !isOfficial && onToggleFollow ? (
                <button
                  type="button"
                  onClick={() => onToggleFollow(post)}
                  className={[
                    "focus-ring rounded-full border px-3 py-1 text-[11px] font-semibold",
                    isFollowingAuthor
                      ? "border-brand-200 bg-brand-50 text-brand-800"
                      : "border-brand-700 bg-brand-700 text-white hover:bg-brand-800",
                  ].join(" ")}
                >
                  {isFollowingAuthor ? "Following" : "Follow"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
        {post.reportCount ? (
          <span className="sr-only">{post.reportCount} reports</span>
        ) : null}
      </header>

      {post.title ? (
        <h4 className="mt-3 break-words px-4 text-base font-bold leading-snug text-stone-950 sm:text-lg">{post.title}</h4>
      ) : null}
      <ExpandableText
        text={post.body}
        maxLines={4}
        preserveWrap
        className={`break-words px-4 text-[1rem] leading-relaxed text-stone-950 sm:text-[1.05rem] ${post.title ? "mt-2" : "mt-3"}`}
        buttonClassName="ml-4"
        renderText={renderHashtagText}
      />

      {!isPublished && isOwnPost && post.moderationReason ? (
        <p className="mx-4 mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          {post.moderationReason}
        </p>
      ) : null}

      {linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-4 mt-3 inline-flex break-all text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
        >
          Open source link
        </a>
      ) : null}

      <PostImages images={post.images} />

      {isPublished && visibleReactionCounts.length ? (
        <div className="mx-4 mt-4 flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
          {visibleReactionCounts.map((reaction) => (
            <span
              key={reaction.value}
              className={[
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1",
                reaction.active
                  ? "border-brand-200 bg-brand-50 text-brand-800"
                  : "border-stone-200 bg-stone-50 text-stone-600",
              ].join(" ")}
            >
              <span>{reaction.shortLabel}</span>
              <span>{reaction.count}</span>
            </span>
          ))}
        </div>
      ) : null}

      {isPublished ? (
        <div className="mt-4 grid grid-cols-4 border-t border-stone-200/80">
          <div className="relative" ref={reactionPickerRef}>
            {reactionPickerOpen ? (
              <div className="absolute left-0 bottom-full z-10 mb-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-stone-200 bg-white p-2 shadow-card">
                <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Choose a reaction
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {reactionOptions.map((reaction) => (
                    <button
                      key={reaction.value}
                      type="button"
                      onClick={() => handleReactionSelect(reaction.value)}
                      className={[
                        "focus-ring inline-flex min-h-10 w-full items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition",
                        reaction.active
                          ? "border-brand-300 bg-brand-50 text-brand-800"
                          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
                      ].join(" ")}
                    >
                      {reaction.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleLikeButtonClick}
              onPointerDown={startLongPress}
              onPointerUp={clearLongPressTimer}
              onPointerLeave={clearLongPressTimer}
              onPointerCancel={clearLongPressTimer}
              onContextMenu={(event) => {
                if (!user) return;
                event.preventDefault();
                clearLongPressTimer();
                suppressNextLikeClickRef.current = true;
                setReactionPickerOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  clearLongPressTimer();
                  setReactionPickerOpen(true);
                }
              }}
              className={[
                "focus-ring flex min-h-14 w-full items-center justify-center gap-1.5 px-1 text-sm font-semibold transition",
                reactButtonActive
                  ? "text-brand-700"
                  : "text-brand-900 hover:bg-brand-50",
              ].join(" ")}
              aria-pressed={reactButtonActive}
              aria-haspopup="menu"
              aria-expanded={reactionPickerOpen}
            >
              <IconHeart filled={reactButtonActive} className="h-4 w-4" />
              <span className="flex flex-col items-start leading-none">
                {primaryReactionCount ? <span className="text-[11px] font-medium">{primaryReactionCount}</span> : null}
                <span>{reactButtonLabel}</span>
              </span>
              <span className="sr-only">Hold or right-click for more reactions.</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => onToggleComments(post.id)}
            className="focus-ring flex min-h-14 items-center justify-center gap-1.5 px-1 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            aria-expanded={commentsExpanded}
          >
            <IconComment />
            <span className="flex flex-col items-start leading-none">
              {commentCount ? <span className="text-[11px] font-medium">{commentCount}</span> : null}
              <span>Comment</span>
            </span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="focus-ring flex min-h-14 items-center justify-center gap-1.5 px-1 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            <IconShare />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={() => onSave?.(post)}
            className={[
              "focus-ring flex min-h-14 items-center justify-center gap-1.5 px-1 text-sm font-semibold hover:bg-brand-50",
              isSaved ? "text-brand-700" : "text-brand-900",
            ].join(" ")}
          >
            <IconSave />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>
        </div>
      ) : isOwnPost ? (
        <p className="mx-4 mt-4 text-xs text-amber-700">Visible only to you while review is pending.</p>
      ) : null}

      {isPublished && !commentsExpanded ? <InlineActionFeedback feedback={actionFeedback} /> : null}

      {isPublished && commentsExpanded ? (
        <CommentSection
          post={post}
          user={user}
          draft={commentDraft}
          isSubmitting={isCommentSubmitting}
          actionFeedback={actionFeedback}
          onDraftChange={onCommentDraftChange}
          onSubmitComment={onSubmitComment}
          onReport={onReport}
          reportedTargetKeys={reportedTargetKeys}
        />
      ) : null}
    </article>
  );
}
