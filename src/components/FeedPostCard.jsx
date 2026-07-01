import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ExpandableText from "./ExpandableText.jsx";
import UserDisplayName from "./UserDisplayName.jsx";
import { categoryLabel, FEED_STATUS_LABELS, shareFeedPostUrl } from "../lib/feed.js";
import { profilePath } from "../lib/profileLinks.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

const OFFICIAL_DISPLAY_NAME = "Thuto Admin";

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
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

function IconThumbsUp({ filled, className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 11v8a1 1 0 001 1h2.5l1.2-5.4a1 1 0 01.98-.8H17a1 1 0 00.98-1.2l-1.2-6A1 1 0 0015.8 6H10a1 1 0 00-1 .8L7 11z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11H4a1 1 0 00-1 1v6a1 1 0 001 1h3" />
    </svg>
  );
}

function IconThumbsDown({ filled, className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 13V5a1 1 0 00-1-1h-2.5l-1.2 5.4a1 1 0 01-.98.8H7a1 1 0 01-.98 1.2l1.2 6A1 1 0 008.2 18H14a1 1 0 001-.8l2-4.2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 13h3a1 1 0 001-1V6a1 1 0 00-1-1h-3" />
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

function IconRepost({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l10-10M17 7H9m8 0v8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 10.5v7a1.5 1.5 0 001.5 1.5h7" />
    </svg>
  );
}

function IconMore({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

function renderHashtagText(text) {
  return String(text || "")
    .split(/(#[\p{L}\p{N}_-]+)/gu)
    .map((part, index) =>
      part.startsWith("#") ? (
        <span key={`${part}-${index}`} className="font-medium text-brand-700">
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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-900 text-sm font-bold text-white">
        T
      </div>
    );
  }
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-stone-200" />;
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800 ring-1 ring-stone-200"
      aria-hidden
    >
      {avatarInitial(displayName)}
    </div>
  );
}

function OfficialBadge() {
  return (
    <span className="rounded bg-brand-800 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
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
        className="mt-2 block overflow-hidden rounded-lg border border-stone-200 bg-stone-50"
      >
        <img
          src={primary.publicUrl}
          alt={primary.altText || "Post image"}
          className="h-auto max-h-72 w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </a>
    );
  }

  return (
    <div className={`mt-2 grid gap-0.5 overflow-hidden rounded-lg border border-stone-200 ${visible.length >= 3 ? "grid-cols-2" : "grid-cols-2"}`}>
      {visible.map((image, index) => (
        <a
          key={image.id || image.publicUrl}
          href={image.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={[visible.length === 3 && index === 0 ? "col-span-2" : ""].join(" ")}
        >
          <img
            src={image.publicUrl}
            alt={image.altText || "Post image"}
            className="aspect-[4/3] h-auto w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </a>
      ))}
    </div>
  );
}

function InlineActionFeedback({ feedback, className = "mt-2" }) {
  if (!feedback?.message) return null;
  return (
    <p
      className={`${className} rounded-lg px-2.5 py-1.5 text-xs ${feedbackClassName(feedback.tone)}`}
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
  return (
    <div className="mt-2 border-t border-stone-200/80 pt-2">
      <InlineActionFeedback feedback={actionFeedback} />

      {post.comments.length ? (
        <ul className="mt-2 space-y-1.5">
          {post.comments.map((comment) => {
            const commentReported = Boolean(reportedTargetKeys?.[targetKey("comment", comment.id)]);
            return (
              <li key={comment.id} className="rounded-lg bg-stone-50 px-2.5 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="inline-flex min-w-0 flex-wrap items-center gap-1 text-[11px] font-semibold text-stone-700">
                      <UserDisplayName name={comment.authorDisplayName} isPro={comment.authorIsPro} badgeClassName="size-3.5" />
                      <span className="font-normal text-stone-400">
                        · {formatRelativeTime(comment.publishedAt || comment.createdAt)}
                      </span>
                    </p>
                    <p className="mt-0.5 whitespace-pre-line break-words text-xs leading-relaxed text-stone-600">{comment.body}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReport({ postId: post.id, targetType: "comment", targetId: comment.id })}
                    disabled={commentReported}
                    className={[
                      "shrink-0 text-[10px] font-medium",
                      commentReported ? "cursor-default text-stone-400" : "text-stone-400 hover:text-red-700",
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
        <p className="mt-2 text-xs text-stone-400">No comments yet.</p>
      )}

      {user ? (
        <form className="mt-2 flex gap-2" onSubmit={(event) => onSubmitComment(event, post.id)}>
          <input
            value={draft || ""}
            onChange={(event) => onDraftChange(post.id, event.target.value)}
            maxLength={1000}
            placeholder="Add a comment..."
            className="min-h-8 min-w-0 flex-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200"
          />
          <button
            type="submit"
            disabled={isSubmitting || !String(draft || "").trim()}
            className="focus-ring shrink-0 rounded-full bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reply
          </button>
        </form>
      ) : (
        <p className="mt-2 text-[11px] text-stone-400">
          <Link to="/auth?mode=login" className="font-medium text-brand-700 hover:underline">
            Log in
          </Link>{" "}
          to comment.
        </p>
      )}
    </div>
  );
}

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
  onDelete,
  onReact,
  onToggleComments,
  onCommentDraftChange,
  onSubmitComment,
  onReport,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const linkUrl = safeExternalUrl(post.linkUrl);
  const isPublished = post.status === "published";
  const isOfficial = Boolean(post.isOfficial);
  const displayName = isOfficial ? OFFICIAL_DISPLAY_NAME : post.authorDisplayName;
  const timeLabel = formatRelativeTime(post.publishedAt || post.createdAt);
  const commentCount = post.comments?.length || 0;
  const likeCount = Number(post.reactionCounts?.like || 0);
  const liked = post.viewerReaction === "like";
  const postReported = Boolean(reportedTargetKeys?.[targetKey("post", post.id)]);
  const authorProfilePath = !isOfficial && post.authorUsername ? profilePath(post.authorUsername) : null;

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

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

  function handleThumbsUp() {
    onReact(post, "like");
  }

  function handleThumbsDown() {
    if (post.viewerReaction) {
      onReact(post, post.viewerReaction);
    }
  }

  return (
    <article
      id={`feed-post-${post.id}`}
      className={["min-w-0 px-3 py-3", !isPublished && isOwnPost ? "bg-amber-50/30" : ""].join(" ")}
    >
      <header className="flex min-w-0 items-start gap-2.5">
        {authorProfilePath ? (
          <Link to={authorProfilePath} className="focus-ring shrink-0 rounded-full">
            <PostAvatar isOfficial={isOfficial} displayName={displayName} avatarUrl={post.authorAvatarUrl} />
          </Link>
        ) : (
          <PostAvatar isOfficial={isOfficial} displayName={displayName} avatarUrl={post.authorAvatarUrl} />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {authorProfilePath ? (
                  <Link to={authorProfilePath} className="focus-ring min-w-0 hover:underline">
                    <UserDisplayName
                      name={displayName}
                      isPro={post.authorIsPro && !isOfficial}
                      className="min-w-0"
                      nameClassName="truncate text-xs font-semibold text-stone-900"
                      badgeClassName="size-3.5"
                    />
                  </Link>
                ) : (
                  <UserDisplayName
                    name={displayName}
                    isPro={post.authorIsPro && !isOfficial}
                    className="min-w-0"
                    nameClassName="truncate text-xs font-semibold text-stone-900"
                    badgeClassName="size-3.5"
                  />
                )}
                {isOfficial ? <OfficialBadge /> : null}
                {timeLabel ? <span className="text-[11px] text-stone-400">{timeLabel}</span> : null}
                {!isPublished && isOwnPost ? (
                  <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold uppercase text-amber-900">
                    {postStatusLabel(post.status)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {user && !isOwnPost && !isOfficial && onToggleFollow ? (
                <button
                  type="button"
                  onClick={() => onToggleFollow(post)}
                  className={[
                    "focus-ring text-[11px] font-semibold",
                    isFollowingAuthor ? "text-stone-500" : "text-brand-700 hover:text-brand-800",
                  ].join(" ")}
                >
                  {isFollowingAuthor ? "Following" : "Follow"}
                </button>
              ) : null}
              <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                {categoryBadgeText(post.category)}
              </span>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                  aria-label="More actions"
                  aria-expanded={menuOpen}
                >
                  <IconMore />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-full z-10 mt-1 min-w-[9rem] rounded-lg border border-stone-200 bg-white py-1 shadow-card">
                    {onSave ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSave(post);
                          setMenuOpen(false);
                        }}
                        className="focus-ring block w-full px-3 py-1.5 text-left text-xs text-stone-700 hover:bg-stone-50"
                      >
                        {isSaved ? "Unsave" : "Save"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        handleShare();
                        setMenuOpen(false);
                      }}
                      className="focus-ring block w-full px-3 py-1.5 text-left text-xs text-stone-700 hover:bg-stone-50"
                    >
                      Share
                    </button>
                    {isOwnPost && onDelete ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(post);
                          setMenuOpen(false);
                        }}
                        className="focus-ring block w-full px-3 py-1.5 text-left text-xs text-red-700 hover:bg-red-50"
                      >
                        Delete post
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        onReport({ postId: post.id, targetType: "post", targetId: post.id });
                        setMenuOpen(false);
                      }}
                      disabled={postReported}
                      className="focus-ring block w-full px-3 py-1.5 text-left text-xs text-stone-700 hover:bg-stone-50 disabled:text-stone-400"
                    >
                      {postReported ? "Reported" : "Report"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      {post.title ? (
        <h3 className="mt-2 break-words text-sm font-semibold leading-snug text-stone-900">{post.title}</h3>
      ) : null}

      <ExpandableText
        text={post.body}
        maxLines={6}
        preserveWrap
        className={`break-words text-xs leading-relaxed text-stone-600 ${post.title ? "mt-1" : "mt-2"}`}
        buttonClassName="text-xs font-medium text-brand-700"
        renderText={renderHashtagText}
      />

      {!isPublished && isOwnPost && post.moderationReason ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800">
          {post.moderationReason}
        </p>
      ) : null}

      {linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex break-all text-xs font-medium text-brand-700 hover:underline"
        >
          Open link
        </a>
      ) : null}

      <PostImages images={post.images} />

      {isPublished ? (
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-stone-500">
            <button
              type="button"
              onClick={handleThumbsUp}
              className={["focus-ring inline-flex items-center gap-1 text-xs font-medium", liked ? "text-brand-700" : "hover:text-brand-700"].join(" ")}
              aria-label="Like"
              aria-pressed={liked}
            >
              <IconThumbsUp filled={liked} />
              {likeCount ? <span>{likeCount}</span> : null}
            </button>
            <button
              type="button"
              onClick={handleThumbsDown}
              className="focus-ring inline-flex items-center gap-1 text-xs font-medium hover:text-stone-700"
              aria-label="Remove like"
            >
              <IconThumbsDown filled={false} />
            </button>
          </div>

          <div className="flex items-center gap-3 text-stone-500">
            <button
              type="button"
              onClick={() => onToggleComments(post.id)}
              className="focus-ring inline-flex items-center gap-1 text-xs font-medium hover:text-brand-700"
              aria-expanded={commentsExpanded}
            >
              <IconComment />
              {commentCount ? <span>{commentCount}</span> : null}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="focus-ring inline-flex items-center text-stone-500 hover:text-brand-700"
              aria-label="Repost"
            >
              <IconRepost />
            </button>
          </div>
        </div>
      ) : isOwnPost ? (
        <p className="mt-2 text-[11px] text-amber-700">Visible only to you while review is pending.</p>
      ) : null}

      {isPublished && !commentsExpanded ? <InlineActionFeedback feedback={actionFeedback} className="mt-2" /> : null}

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
