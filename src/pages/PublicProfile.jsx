import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import FeedPostCard from "../components/FeedPostCard.jsx";
import UserDisplayName from "../components/UserDisplayName.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import {
  fetchConnectionStatusMap,
  respondConnectionRequest,
  sendConnectionRequest,
} from "../lib/connections.js";
import { deleteFeedPost, fetchFeedPostById, patchPostReaction, reportFeedTarget, setFeedReaction, submitFeedComment } from "../lib/feed.js";
import { toggleFollowUser } from "../lib/feedFollows.js";
import { getOrCreateConversation } from "../lib/messaging.js";
import { fetchFollowingSetForUsers } from "../lib/people.js";
import { fetchProfileByUsername, fetchProfileCounts, fetchPostsByAuthor } from "../lib/publicProfile.js";
import { profilePath } from "../lib/profileLinks.js";
import { fetchSavedPostSet, toggleSavedPost } from "../lib/savedPosts.js";

function profileInitial(name) {
  const letter = String(name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

function formatProfileCount(value) {
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

function MessageIcon({ className = "size-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 2 11 13M22 2l-7 20-4-9-9-4Z"
      />
    </svg>
  );
}

export default function PublicProfile() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const { user, profile: ownProfile, supabaseConfigured, isPremium } = useAuth();
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("none");
  const [savedPostIds, setSavedPostIds] = useState(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentSubmittingFor, setCommentSubmittingFor] = useState("");
  const [postFeedbackById, setPostFeedbackById] = useState({});
  const [reportedTargetKeys, setReportedTargetKeys] = useState({});

  useDocumentTitle(profile?.fullName ? `${profile.fullName} | Thuto` : "Profile | Thuto");

  const loadProfile = useCallback(async () => {
    if (!routeUsername) {
      setProfile(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const nextProfile = await fetchProfileByUsername(routeUsername);
      if (!nextProfile) {
        setProfile(null);
        setPosts([]);
        return;
      }
      setProfile(nextProfile);
      const [nextCounts, nextPosts] = await Promise.all([
        fetchProfileCounts(nextProfile.id),
        fetchPostsByAuthor(nextProfile.id, { limit: 20 }),
      ]);
      setCounts(nextCounts);
      setPosts(nextPosts);
      setSavedPostIds(await fetchSavedPostSet(nextPosts.map((post) => post.id)));

      if (user && user.id !== nextProfile.id) {
        const [followingSet, connectionMap] = await Promise.all([
          fetchFollowingSetForUsers([nextProfile.id]),
          fetchConnectionStatusMap([nextProfile.id]),
        ]);
        setIsFollowing(followingSet.has(nextProfile.id));
        setConnectionStatus(connectionMap.get(nextProfile.id) || "none");
      } else {
        setIsFollowing(false);
        setConnectionStatus("none");
      }
    } catch (err) {
      setError(err.message || "Could not load profile.");
      setProfile(null);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [routeUsername, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (ownProfile?.username && routeUsername?.toLowerCase() === ownProfile.username.toLowerCase()) {
    return <Navigate to="/profile" replace />;
  }

  async function handleFollow() {
    if (!profile) return;
    try {
      const nowFollowing = await toggleFollowUser(profile.id);
      setIsFollowing(nowFollowing);
    } catch (err) {
      setError(err.message || "Could not update follow.");
    }
  }

  async function handleConnect() {
    if (!profile) return;
    if (connectionStatus === "pending_incoming") {
      navigate("/feed/notifications");
      return;
    }
    if (connectionStatus !== "none") return;
    try {
      await sendConnectionRequest(profile.id);
      setConnectionStatus("pending_outgoing");
    } catch (err) {
      setError(err.message || "Could not send connection request.");
    }
  }

  async function handleMessage() {
    if (!profile) return;
    try {
      const conversationId = await getOrCreateConversation(profile.id);
      navigate(`/feed/messages/${conversationId}`);
    } catch (err) {
      setError(err.message || "Could not open messages.");
    }
  }

  async function handleIncomingAccept() {
    if (!profile) return;
    try {
      await respondConnectionRequest(profile.id, true);
      setConnectionStatus("accepted");
    } catch (err) {
      setError(err.message || "Could not accept connection.");
    }
  }

  async function handleReaction(post, reaction) {
    let nextReaction = null;
    let rollbackPost = post;

    setPosts((current) => {
      const target = current.find((item) => item.id === post.id);
      if (!target) return current;
      rollbackPost = target;
      const patched = patchPostReaction(target, reaction);
      nextReaction = patched.nextReaction;
      return current.map((item) => (item.id === post.id ? patched.post : item));
    });

    try {
      await setFeedReaction({ postId: post.id, reaction: nextReaction });
    } catch (err) {
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, viewerReaction: rollbackPost.viewerReaction, reactionCounts: rollbackPost.reactionCounts }
            : item,
        ),
      );
      setPostFeedbackById((current) => ({ ...current, [post.id]: { tone: "error", message: err.message } }));
    }
  }

  async function handleSubmitComment(event, postId) {
    event.preventDefault();
    const body = (commentDrafts[postId] || "").trim();
    if (!body) return;
    if (!user) {
      setPostFeedbackById((current) => ({ ...current, [postId]: { tone: "notice", message: "Log in to comment on feed posts." } }));
      return;
    }
    setCommentSubmittingFor(postId);
    setPostFeedbackById((current) => {
      if (!current[postId]) return current;
      const next = { ...current };
      delete next[postId];
      return next;
    });
    try {
      const result = await submitFeedComment({ postId, body });
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      setExpandedComments((current) => ({ ...current, [postId]: true }));
      const status = result.comment?.status;
      const message =
        status === "published"
          ? "Comment posted."
          : status === "rejected"
            ? "Comment not published. AI rejected it for safety or relevance."
            : status === "pending_ai"
              ? "Comment submitted. AI moderation is still processing it."
              : "Comment submitted for admin review. It will appear once approved.";
      setPostFeedbackById((current) => ({ ...current, [postId]: { tone: "notice", message } }));
      const updated = await fetchFeedPostById(postId);
      if (updated) {
        setPosts((current) => current.map((item) => (item.id === postId ? updated : item)));
      }
    } catch (err) {
      setPostFeedbackById((current) => ({ ...current, [postId]: { tone: "error", message: err.message } }));
    } finally {
      setCommentSubmittingFor("");
    }
  }

  async function handleSave(post) {
    try {
      const saved = await toggleSavedPost(post.id);
      setSavedPostIds((current) => {
        const next = new Set(current);
        if (saved) next.add(post.id);
        else next.delete(post.id);
        return next;
      });
    } catch (err) {
      setPostFeedbackById((current) => ({ ...current, [post.id]: { tone: "error", message: err.message } }));
    }
  }

  async function handleDeletePost(post) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await deleteFeedPost({ postId: post.id });
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (err) {
      setPostFeedbackById((current) => ({ ...current, [post.id]: { tone: "error", message: err.message } }));
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="px-4 pt-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Profiles need Supabase to be configured on this build.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <p className="px-4 pt-2 text-sm text-stone-500">Loading profile...</p>;
  }

  if (!profile) {
    return (
      <div className="space-y-3 px-4 pt-2">
        <h1 className="font-display text-xl font-semibold text-brand-900">Profile not found</h1>
        <p className="text-sm text-stone-600">We could not find @{routeUsername}.</p>
        <Link to="/feed/people" className="text-sm font-semibold text-brand-800 underline">
          Browse people
        </Link>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const hasBioSection = Boolean(profile.distinction?.trim());
  const hasFieldsOfInterest = profile.fieldsOfInterest.length > 0;

  return (
    <div className="space-y-0 pt-0">
      {error ? (
        <p className="mx-4 mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <section className="border-b border-stone-200/70 bg-white pb-4">
        <div className="relative h-28 bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 sm:h-32">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 85%, rgba(255,255,255,0.35) 0%, transparent 45%), radial-gradient(circle at 85% 15%, rgba(0,0,0,0.2) 0%, transparent 40%)",
            }}
          />
          <div className="absolute right-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-800 shadow-sm">
            Thuto
          </div>
        </div>

        <div className="relative px-4">
          <div className="relative -mt-10 mb-3 inline-block">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-brand-100 ring-4 ring-white sm:h-[5.25rem] sm:w-[5.25rem]">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand-800">
                  {profileInitial(profile.fullName)}
                </span>
              )}
            </div>
            {profile.isPro ? (
              <span
                className="absolute bottom-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-brand-700 text-white ring-2 ring-white"
                title="Verified Pro"
                aria-label="Verified Pro"
              >
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : null}
          </div>

          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold leading-tight text-brand-900 sm:text-2xl">
              <UserDisplayName
                name={profile.fullName}
                isPro={profile.isPro}
                nameClassName="min-w-0 break-words"
                badgeClassName="size-4 shrink-0"
              />
            </h1>

            {profile.bio ? (
              <p className="mt-1 text-sm leading-snug text-stone-700">{profile.bio}</p>
            ) : null}

            {profile.universityLine ? (
              <p className="mt-0.5 text-xs text-brand-800/90">{profile.universityLine}</p>
            ) : null}

            <p className="mt-2 text-xs text-stone-600">
              <span className="font-semibold text-brand-900">{formatProfileCount(counts.followers)}</span> followers
              <span className="mx-1.5 text-stone-400" aria-hidden>
                •
              </span>
              <span className="font-semibold text-brand-900">{formatProfileCount(counts.following)}</span> following
            </p>
          </div>

          {user && !isOwnProfile ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleFollow}
                className={[
                  "focus-ring flex-1 rounded-full px-4 py-2.5 text-sm font-semibold sm:flex-none",
                  isFollowing
                    ? "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                    : "bg-brand-700 text-white hover:bg-brand-800",
                ].join(" ")}
              >
                {isFollowing ? "Following" : "+ Follow"}
              </button>
              <button
                type="button"
                onClick={handleMessage}
                className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 sm:flex-none"
              >
                <MessageIcon />
                Message
              </button>
              {connectionStatus === "pending_incoming" ? (
                <button
                  type="button"
                  onClick={handleIncomingAccept}
                  className="focus-ring rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Accept connection
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connectionStatus === "pending_outgoing" || connectionStatus === "accepted"}
                  className="focus-ring rounded-full border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
                >
                  {connectLabel(connectionStatus)}
                </button>
              )}
            </div>
          ) : null}

          {user && !isPremium && !isOwnProfile ? (
            <p className="mt-3 text-xs text-slate-600">
              Free accounts can message people who follow you or accepted connections.{" "}
              <Link to="/upgrade" className="font-semibold text-brand-700 underline">
                Pro
              </Link>{" "}
              lets you message anyone.
            </p>
          ) : null}

          {!user ? (
            <p className="mt-4 text-sm text-stone-600">
              <Link
                to={`/auth?mode=login&next=${encodeURIComponent(profilePath(profile.username) || "/feed")}`}
                className="font-semibold text-brand-800 underline"
              >
                Sign in
              </Link>{" "}
              to follow, connect, or message {profile.fullName}.
            </p>
          ) : null}
        </div>
      </section>

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

      <section className="space-y-3 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-brand-900">Posts</h2>
          {posts.length > 0 ? (
            <span className="text-xs font-semibold text-stone-500">{posts.length} shown</span>
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
                onToggleFollow={() => handleFollow()}
                onReact={handleReaction}
                onToggleComments={(postId) => setExpandedComments((current) => ({ ...current, [postId]: !current[postId] }))}
                onCommentDraftChange={(postId, value) => setCommentDrafts((current) => ({ ...current, [postId]: value }))}
                onSubmitComment={handleSubmitComment}
                onReport={async ({ postId, targetType, targetId }) => {
                  await reportFeedTarget({ postId, targetType, targetId });
                  setReportedTargetKeys((current) => ({ ...current, [`${targetType}:${targetId}`]: true }));
                }}
                onSave={handleSave}
                onDelete={handleDeletePost}
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
