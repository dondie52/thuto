import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import FeedPostCard from "../components/FeedPostCard.jsx";
import ProVerificationBadge from "../components/ProVerificationBadge.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import {
  fetchConnectionStatusMap,
  respondConnectionRequest,
  sendConnectionRequest,
} from "../lib/connections.js";
import { reportFeedTarget, setFeedReaction, submitFeedComment } from "../lib/feed.js";
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

function connectLabel(status) {
  if (status === "accepted") return "Connected";
  if (status === "pending_outgoing") return "Requested";
  if (status === "pending_incoming") return "Respond";
  return "Connect";
}

export default function PublicProfile() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const { user, profile: ownProfile, supabaseConfigured } = useAuth();
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
    try {
      await setFeedReaction({ postId: post.id, reaction });
      await loadProfile();
    } catch (err) {
      setPostFeedbackById((current) => ({ ...current, [post.id]: { tone: "error", message: err.message } }));
    }
  }

  async function handleSubmitComment(event, postId) {
    event.preventDefault();
    const body = (commentDrafts[postId] || "").trim();
    if (!body) return;
    setCommentSubmittingFor(postId);
    try {
      await submitFeedComment({ postId, body });
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      await loadProfile();
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

  return (
    <div className="space-y-4 px-4 pt-2">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <section className="bg-white p-4">
        <div className="flex items-start gap-4">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-brand-100" />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-700 text-2xl font-bold text-white">
              {profileInitial(profile.fullName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="flex min-w-0 items-center gap-1.5 font-display text-xl font-semibold text-brand-900">
              <span className="truncate">{profile.fullName}</span>
              {profile.isPro ? <ProVerificationBadge className="size-[18px] shrink-0" /> : null}
            </h1>
            <div className="mt-1 flex flex-wrap gap-4 text-sm text-stone-600">
              <span>
                <span className="font-semibold text-brand-900">{counts.followers}</span> followers
              </span>
              <span>
                <span className="font-semibold text-brand-900">{counts.following}</span> following
              </span>
            </div>
            {profile.universityLine ? <p className="mt-1 text-sm text-brand-800">{profile.universityLine}</p> : null}
          </div>
        </div>

        {profile.bio || profile.distinction ? (
          <div className="mt-4 space-y-2">
            {profile.bio ? (
              <p className="text-sm leading-relaxed text-stone-700">{profile.bio}</p>
            ) : null}
            {profile.distinction ? (
              <p className="text-sm text-stone-500">{profile.distinction}</p>
            ) : null}
          </div>
        ) : null}
        {profile.fieldsOfInterest.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.fieldsOfInterest.map((field) => (
              <span key={field} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                {field}
              </span>
            ))}
          </div>
        ) : null}

        {user && !isOwnProfile ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleFollow}
              className={[
                "focus-ring rounded-full px-4 py-2 text-sm font-semibold",
                isFollowing ? "border border-brand-200 bg-white text-brand-800" : "bg-brand-700 text-white hover:bg-brand-800",
              ].join(" ")}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
            {connectionStatus === "pending_incoming" ? (
              <button
                type="button"
                onClick={handleIncomingAccept}
                className="focus-ring rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Accept connection
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={connectionStatus === "pending_outgoing" || connectionStatus === "accepted"}
                className="focus-ring rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
              >
                {connectLabel(connectionStatus)}
              </button>
            )}
            <button
              type="button"
              onClick={handleMessage}
              className="focus-ring rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
            >
              Message
            </button>
          </div>
        ) : null}

        {!user ? (
          <p className="mt-4 text-sm text-stone-600">
            <Link to={`/auth?mode=login&next=${encodeURIComponent(profilePath(profile.username) || "/feed")}`} className="font-semibold text-brand-800 underline">
              Sign in
            </Link>{" "}
            to follow, connect, or message {profile.fullName}.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-brand-900">Posts</h2>
        {!posts.length ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-stone-600">
            {profile.fullName} has not posted yet.
          </div>
        ) : (
          <div className="divide-y divide-stone-200/80 border-y border-stone-200/80 bg-white">
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
