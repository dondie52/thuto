import { Link } from "react-router-dom";
import { categoryLabel, FEED_STATUS_LABELS } from "../lib/feed.js";
import { safeExternalUrl } from "../lib/urlSafety.js";

const OFFICIAL_DISPLAY_NAME = "Thuto Admin";

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

function PostAvatar({ isOfficial, displayName }) {
  if (isOfficial) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-800 text-lg font-bold text-white ring-2 ring-white">
        T
      </div>
    );
  }
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-800 ring-2 ring-white"
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

function FeaturedImage({ images }) {
  const primary = images?.[0];
  if (!primary?.publicUrl) return null;
  return (
    <a
      href={primary.publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 block overflow-hidden rounded-2xl border border-stone-200 bg-stone-100"
    >
      <img
        src={primary.publicUrl}
        alt={primary.altText || "Post image"}
        className="aspect-[16/10] w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </a>
  );
}

function CommentSection({
  post,
  user,
  draft,
  isSubmitting,
  commentInputRef,
  onDraftChange,
  onSubmitComment,
  onReport,
}) {
  return (
    <div className="mt-4 border-t border-stone-100 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Comments</p>
        <button
          type="button"
          onClick={() => onReport("post", post.id)}
          className="text-xs font-semibold text-stone-500 underline hover:text-red-700"
        >
          Report
        </button>
      </div>

      {post.comments.length ? (
        <ul className="mt-3 space-y-2">
          {post.comments.map((comment) => (
            <li key={comment.id} className="rounded-xl bg-stone-50 px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-900">{comment.authorDisplayName}</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-700">{comment.body}</p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    {formatRelativeTime(comment.publishedAt || comment.createdAt)}
                  </p>
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
        <p className="mt-3 rounded-xl bg-stone-50 px-3 py-3 text-sm text-stone-500">No comments yet.</p>
      )}

      {user ? (
        <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={(event) => onSubmitComment(event, post.id)}>
          <input
            ref={commentInputRef}
            value={draft || ""}
            onChange={(event) => onDraftChange(post.id, event.target.value)}
            maxLength={1000}
            placeholder="Write a reply..."
            className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="submit"
            disabled={isSubmitting || !String(draft || "").trim()}
            className="focus-ring rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
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
 *   commentInputRef?: (node: HTMLInputElement | null) => void,
 *   onReact: (post: object, reaction: string) => void,
 *   onToggleComments: (postId: string) => void,
 *   onCommentDraftChange: (postId: string, value: string) => void,
 *   onSubmitComment: (event: import("react").FormEvent, postId: string) => void,
 *   onReport: (targetType: string, targetId: string) => void,
 * }} props
 */
export default function FeedPostCard({
  post,
  user,
  isOwnPost = false,
  commentsExpanded = false,
  commentDraft = "",
  isCommentSubmitting = false,
  commentInputRef,
  onReact,
  onToggleComments,
  onCommentDraftChange,
  onSubmitComment,
  onReport,
}) {
  const linkUrl = safeExternalUrl(post.linkUrl);
  const isPublished = post.status === "published";
  const isOfficial = Boolean(post.isOfficial);
  const displayName = isOfficial ? OFFICIAL_DISPLAY_NAME : post.authorDisplayName;
  const timeLabel = formatRelativeTime(post.publishedAt || post.createdAt);
  const metaLine = isOfficial && timeLabel ? `Official • ${timeLabel}` : timeLabel;
  const likeCount = post.reactionCounts?.like || 0;
  const commentCount = post.comments?.length || 0;
  const liked = post.viewerReaction === "like";

  return (
    <article
      className={[
        "rounded-2xl border bg-white p-4 shadow-sm sm:p-5",
        isPublished ? "border-stone-200" : "border-amber-200 bg-amber-50/30",
      ].join(" ")}
    >
      <header className="flex items-start gap-3">
        <PostAvatar isOfficial={isOfficial} displayName={displayName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="truncate text-sm font-bold text-stone-900">{displayName}</h3>
                {isOfficial ? <OfficialBadge /> : null}
                {!isPublished && isOwnPost ? (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                    {postStatusLabel(post.status)}
                  </span>
                ) : null}
              </div>
              {metaLine ? <p className="mt-0.5 text-xs text-stone-500">{metaLine}</p> : null}
            </div>
            <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-800 ring-1 ring-brand-100">
              {categoryBadgeText(post.category)}
            </span>
          </div>
        </div>
        {post.reportCount ? (
          <span className="sr-only">{post.reportCount} reports</span>
        ) : null}
      </header>

      {post.title ? (
        <h4 className="mt-4 font-display text-lg font-semibold leading-snug text-stone-900">{post.title}</h4>
      ) : null}
      <p className={`whitespace-pre-line text-sm leading-relaxed text-stone-700 ${post.title ? "mt-2" : "mt-4"}`}>
        {post.body}
      </p>

      {!isPublished && isOwnPost && post.moderationReason ? (
        <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs leading-relaxed text-amber-900">
          {post.moderationReason}
        </p>
      ) : null}

      {linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex break-all text-sm font-semibold text-brand-800 underline decoration-brand-300 underline-offset-2 hover:text-brand-950"
        >
          Open source link
        </a>
      ) : null}

      <FeaturedImage images={post.images} />

      {isPublished ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={!user}
            onClick={() => onReact(post, "like")}
            className={[
              "focus-ring flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-semibold transition",
              liked
                ? "border-orange-200 bg-orange-50 text-orange-600"
                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
              !user ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
            aria-pressed={liked}
          >
            <IconHeart filled={liked} className="h-4 w-4" />
            <span>{likeCount || "Like"}</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleComments(post.id)}
            className="focus-ring flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
            aria-expanded={commentsExpanded}
          >
            <IconComment />
            <span>{commentCount || "Comment"}</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleComments(post.id, { focusReply: true })}
            className="focus-ring flex min-h-10 items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white px-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            <span className="text-lg leading-none" aria-hidden>
              +
            </span>
            Reply
          </button>
        </div>
      ) : isOwnPost ? (
        <p className="mt-4 text-xs text-amber-800">Only you can see this until it is approved for the public feed.</p>
      ) : null}

      {isPublished && commentsExpanded ? (
        <CommentSection
          post={post}
          user={user}
          draft={commentDraft}
          isSubmitting={isCommentSubmitting}
          commentInputRef={commentInputRef}
          onDraftChange={onCommentDraftChange}
          onSubmitComment={onSubmitComment}
          onReport={onReport}
        />
      ) : null}
    </article>
  );
}
