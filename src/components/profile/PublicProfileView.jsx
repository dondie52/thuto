import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FeedPostCard from "../FeedPostCard.jsx";
import UserDisplayName from "../UserDisplayName.jsx";
import { absoluteSiteUrl } from "../../lib/seo.js";
import { safeExternalUrl } from "../../lib/urlSafety.js";

function profileInitial(name) {
  const letter = String(name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

export function formatProfileCount(value) {
  const count = Number(value) || 0;
  if (count >= 1_000_000) {
    const compact = count / 1_000_000;
    return `${compact >= 10 ? Math.round(compact) : compact.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 10_000) {
    const compact = count / 1_000;
    return `${compact >= 100 ? Math.round(compact) : compact.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toLocaleString();
}

function connectLabel(status) {
  if (status === "accepted") return "Connected";
  if (status === "pending_outgoing") return "Requested";
  if (status === "pending_incoming") return "Respond";
  return "Connect";
}

function universityStatusLabel(status) {
  if (status === "studying") return "Current student";
  if (status === "aspiring") return "Prospective student";
  return "";
}

function ThutoBannerMark() {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-white/95 px-2 py-1 shadow-sm">
      <span className="flex size-5 items-center justify-center rounded bg-brand-700 text-[10px] font-bold text-white">T</span>
      <span className="text-[11px] font-bold tracking-wide text-brand-900">Thuto</span>
    </div>
  );
}

function LocationIcon({ className = "" }) {
  return (
    <svg className={`size-3.5 ${className}`.trim()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.5 7-10a7 7 0 10-14 0c0 5.5 7 10 7 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function LinkIcon({ className = "" }) {
  return (
    <svg className={`size-3.5 ${className}`.trim()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 00-7.07-7.07L10 5M14 11a5 5 0 00-7.07 0L5.52 12.4a5 5 0 007.07 7.07L14 19" />
    </svg>
  );
}

function MessageIcon({ className = "size-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" />
    </svg>
  );
}

function GlobeIcon({ className = "size-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.8 4 6.4 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6.4-4 9s1.5 6.2 4 9" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "" }) {
  return (
    <svg className={`size-4 ${className}`.trim()} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14 21 3M21 14v6a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h6" />
    </svg>
  );
}

function BriefcaseIcon({ className = "size-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M4 9h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" />
    </svg>
  );
}

function MoreIcon({ className = "size-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

function ProfileMoreMenu({ connectionStatus, onConnect, onIncomingAccept, onShare }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="focus-ring flex size-11 items-center justify-center rounded-full border border-brand-700/30 bg-white text-brand-800 hover:bg-brand-50"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="More actions"
      >
        <MoreIcon />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {connectionStatus === "pending_incoming" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onIncomingAccept();
              }}
              className="block w-full px-3 py-2 text-left text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              Accept connection
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              disabled={connectionStatus === "pending_outgoing" || connectionStatus === "accepted"}
              onClick={() => {
                setOpen(false);
                onConnect();
              }}
              className="block w-full px-3 py-2 text-left text-sm font-medium text-brand-800 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connectLabel(connectionStatus)}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onShare();
            }}
            className="block w-full px-3 py-2 text-left text-sm font-medium text-brand-800 hover:bg-brand-50"
          >
            Share profile
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ProfileExperienceCard({ profile }) {
  const title = profile.bio?.trim();
  const organization = profile.universityName?.trim();
  if (!title && !organization) return null;

  const statusLabel = universityStatusLabel(profile.universityStatus);

  return (
    <div className="mx-4 mb-4 flex gap-3 rounded-xl bg-stone-100/90 px-3.5 py-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-800 shadow-sm">
        <BriefcaseIcon />
      </div>
      <div className="min-w-0">
        {title ? <p className="text-sm font-semibold text-brand-900">{title}</p> : null}
        {organization ? (
          <p className="mt-0.5 text-xs text-stone-600">
            {organization}
            {statusLabel ? ` • ${statusLabel}` : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * LinkedIn-style public profile layout.
 */
export default function PublicProfileView({
  profile,
  counts,
  posts,
  user,
  isFollowing,
  connectionStatus,
  savedPostIds,
  expandedComments,
  commentDrafts,
  commentSubmittingFor,
  postFeedbackById,
  reportedTargetKeys,
  university,
  signInHref,
  onFollow,
  onConnect,
  onMessage,
  onIncomingAccept,
  onReaction,
  onToggleComments,
  onCommentDraftChange,
  onSubmitComment,
  onReport,
  onSave,
  onDeletePost,
}) {
  const postsRef = useRef(null);
  const isOwnProfile = Boolean(user?.id && profile.id === user.id);
  const profileBadge = profile.fieldsOfInterest?.[0]?.trim() || "";
  const profileUrl = profile.username ? absoluteSiteUrl(`/feed/u/${encodeURIComponent(profile.username)}`) : "";
  const profileLinkLabel = profileUrl ? profileUrl.replace(/^https?:\/\//, "") : "";
  const locationLabel = university?.location?.trim() || "";
  const websiteHref = safeExternalUrl(university?.website);
  const hasBioSection = Boolean(profile.distinction?.trim());
  const hasFieldsOfInterest = profile.fieldsOfInterest.length > 0;

  async function handleShareProfile() {
    if (!profileUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${profile.fullName} on Thuto`, url: profileUrl });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-0 bg-white pb-6">
      <section className="border-b border-stone-200/70">
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 sm:h-36">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(315deg, rgba(255,255,255,0.08) 25%, transparent 25%)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.12),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(0,0,0,0.25),transparent_50%)]" />
          <div className="absolute right-3 top-3">
            <ThutoBannerMark />
          </div>
        </div>

        <div className="relative px-4 pb-4">
          <div className="relative -mt-12 mb-3 inline-block">
            <div className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-full bg-brand-100 ring-4 ring-white sm:h-24 sm:w-24">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-brand-800">
                  {profileInitial(profile.fullName)}
                </span>
              )}
            </div>
            {profile.isPro ? (
              <span
                className="absolute bottom-1 right-1 flex size-6 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-white"
                title="Verified Pro"
                aria-label="Verified Pro"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : null}
          </div>

          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 font-display text-[1.35rem] font-bold leading-tight text-brand-900 sm:text-2xl">
              <UserDisplayName
                name={profile.fullName}
                isPro={profile.isPro}
                nameClassName="min-w-0 break-words"
                badgeClassName="size-4 shrink-0"
              />
            </h1>
            {profileBadge ? (
              <span className="shrink-0 rounded-full bg-brand-800 px-2.5 py-1 text-[11px] font-semibold text-white">
                {profileBadge}
              </span>
            ) : null}
          </div>

          {profile.bio ? <p className="mt-1.5 text-sm leading-snug text-stone-700">{profile.bio}</p> : null}

          {locationLabel || profileLinkLabel ? (
            <div className="mt-2 space-y-1 text-xs text-stone-600">
              {locationLabel ? (
                <p className="flex items-center gap-1.5">
                  <LocationIcon className="shrink-0 text-stone-500" />
                  <span>{locationLabel}</span>
                </p>
              ) : null}
              {profileLinkLabel ? (
                <p className="flex items-center gap-1.5">
                  <LinkIcon className="shrink-0 text-stone-500" />
                  <a href={profileUrl} className="truncate font-medium text-brand-700 hover:underline">
                    {profileLinkLabel}
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="mt-2.5 text-xs text-stone-600">
            <span className="font-semibold text-brand-900">{formatProfileCount(counts.followers)}</span> followers
            <span className="mx-1.5 text-stone-400" aria-hidden>
              •
            </span>
            <span className="font-semibold text-brand-900">{formatProfileCount(counts.following)}</span> following
          </p>

          {user && !isOwnProfile ? (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={onFollow}
                className={[
                  "focus-ring w-full rounded-full px-4 py-2.5 text-sm font-semibold",
                  isFollowing
                    ? "border border-brand-700/30 bg-white text-brand-800 hover:bg-brand-50"
                    : "bg-brand-700 text-white hover:bg-brand-800",
                ].join(" ")}
              >
                {isFollowing ? "Following" : "+ Follow"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onMessage}
                  className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full border border-brand-700/30 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  <MessageIcon />
                  Message
                </button>
                <ProfileMoreMenu
                  connectionStatus={connectionStatus}
                  onConnect={onConnect}
                  onIncomingAccept={onIncomingAccept}
                  onShare={handleShareProfile}
                />
              </div>
              {websiteHref ? (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring flex w-full items-center justify-between rounded-full border border-brand-700/30 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
                >
                  <span className="flex items-center gap-2">
                    <GlobeIcon />
                    Visit website
                  </span>
                  <ExternalLinkIcon className="text-stone-500" />
                </a>
              ) : null}
            </div>
          ) : null}

          {!user ? (
            <p className="mt-4 text-sm text-stone-600">
              <Link to={signInHref} className="font-semibold text-brand-800 underline">
                Sign in
              </Link>{" "}
              to follow, connect, or message {profile.fullName}.
            </p>
          ) : null}
        </div>
      </section>

      <ProfileExperienceCard profile={profile} />

      {hasBioSection || hasFieldsOfInterest ? (
        <section className="border-b border-stone-200/70 px-4 py-4">
          <h2 className="font-display text-base font-semibold text-brand-900">Bio</h2>
          {hasBioSection ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-700">{profile.distinction}</p>
          ) : null}
          {hasFieldsOfInterest ? (
            <div className={`flex flex-wrap gap-1.5 ${hasBioSection ? "mt-3" : "mt-2"}`}>
              {profile.fieldsOfInterest.map((field) => (
                <span
                  key={field}
                  className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-800"
                >
                  {field}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section ref={postsRef} className="space-y-3 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-brand-900">Posts</h2>
          {posts.length > 3 ? (
            <button
              type="button"
              onClick={() => postsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              View all
            </button>
          ) : null}
        </div>
        {!posts.length ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-stone-600">
            {profile.fullName} has not posted yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white">
            {posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                user={user}
                isOwnPost={Boolean(user?.id && post.authorId === user.id)}
                commentsExpanded={Boolean(expandedComments[post.id])}
                commentDraft={commentDrafts[post.id]}
                isCommentSubmitting={commentSubmittingFor === post.id}
                isFollowingAuthor={isFollowing}
                isSaved={savedPostIds.has(post.id)}
                onToggleFollow={onFollow}
                onReact={onReaction}
                onToggleComments={onToggleComments}
                onCommentDraftChange={onCommentDraftChange}
                onSubmitComment={onSubmitComment}
                onReport={onReport}
                onSave={onSave}
                onDelete={onDeletePost}
                actionFeedback={postFeedbackById[post.id] || null}
                reportedTargetKeys={reportedTargetKeys}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
