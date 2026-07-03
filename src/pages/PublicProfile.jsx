import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import PublicProfileView from "../components/profile/PublicProfileView.jsx";
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
import { fetchUniversities } from "../lib/universitiesData.js";

export default function PublicProfile() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const { user, profile: ownProfile, supabaseConfigured, isPremium } = useAuth();
  const [profile, setProfile] = useState(null);
  const [university, setUniversity] = useState(null);
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
      setUniversity(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const nextProfile = await fetchProfileByUsername(routeUsername);
      if (!nextProfile) {
        setProfile(null);
        setUniversity(null);
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

      if (nextProfile.universityId) {
        fetchUniversities()
          .then(({ list }) => setUniversity(list.find((item) => item.id === nextProfile.universityId) || null))
          .catch(() => setUniversity(null));
      } else {
        setUniversity(null);
      }

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
      setUniversity(null);
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

  const signInHref = `/auth?mode=login&next=${encodeURIComponent(profilePath(profile.username) || "/feed")}`;

  return (
    <div className="space-y-0 pt-0">
      {error ? (
        <p className="mx-4 mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <PublicProfileView
        profile={profile}
        counts={counts}
        posts={posts}
        user={user}
        isFollowing={isFollowing}
        connectionStatus={connectionStatus}
        savedPostIds={savedPostIds}
        expandedComments={expandedComments}
        commentDrafts={commentDrafts}
        commentSubmittingFor={commentSubmittingFor}
        postFeedbackById={postFeedbackById}
        reportedTargetKeys={reportedTargetKeys}
        university={university}
        signInHref={signInHref}
        onFollow={handleFollow}
        onConnect={handleConnect}
        onMessage={handleMessage}
        onIncomingAccept={handleIncomingAccept}
        onReaction={handleReaction}
        onToggleComments={(postId) => setExpandedComments((current) => ({ ...current, [postId]: !current[postId] }))}
        onCommentDraftChange={(postId, value) => setCommentDrafts((current) => ({ ...current, [postId]: value }))}
        onSubmitComment={handleSubmitComment}
        onReport={async ({ postId, targetType, targetId }) => {
          await reportFeedTarget({ postId, targetType, targetId });
          setReportedTargetKeys((current) => ({ ...current, [`${targetType}:${targetId}`]: true }));
        }}
        onSave={handleSave}
        onDeletePost={handleDeletePost}
      />

      {user && !isPremium && user.id !== profile.id ? (
        <p className="px-4 pb-4 text-xs text-slate-600">
          Free accounts can message people who follow you or accepted connections.{" "}
          <Link to="/upgrade" className="font-semibold text-brand-700 underline">
            Pro
          </Link>{" "}
          lets you message anyone.
        </p>
      ) : null}
    </div>
  );
}
