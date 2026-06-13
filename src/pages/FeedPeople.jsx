import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../lib/auth.jsx";
import { sendConnectionRequest, fetchPendingOutgoingSet } from "../lib/connections.js";
import { toggleFollowUser } from "../lib/feedFollows.js";
import { getOrCreateConversation } from "../lib/messaging.js";
import {
  fetchDiscoverProfiles,
  fetchFollowerProfiles,
  fetchFollowingProfiles,
  fetchFollowingSetForUsers,
} from "../lib/people.js";

const TABS = [
  { id: "discover", label: "Discover" },
  { id: "following", label: "Following" },
  { id: "followers", label: "Followers" },
];

function profileInitial(name) {
  const letter = String(name || "S")
    .trim()
    .charAt(0)
    .toUpperCase();
  return letter || "S";
}

function PersonRow({ person, isFollowing, isPendingConnect, onFollow, onConnect, onMessage, showActions }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 shadow-sm">
      {person.avatarUrl ? (
        <img src={person.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
          {profileInitial(person.fullName)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-brand-900">{person.fullName}</p>
        <p className="truncate text-xs text-stone-500">
          {person.username ? `@${person.username}` : "Student"}
          {person.universityLine ? ` · ${person.universityLine}` : ""}
        </p>
        {person.bio ? <p className="mt-1 line-clamp-2 text-xs text-stone-600">{person.bio}</p> : null}
      </div>
      {showActions ? (
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={() => onFollow(person.id)}
            className={[
              "focus-ring rounded-full px-3 py-2 text-xs font-semibold",
              isFollowing ? "border border-brand-200 bg-white text-brand-800" : "bg-brand-700 text-white hover:bg-brand-800",
            ].join(" ")}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
          <button
            type="button"
            onClick={() => onConnect(person.id)}
            disabled={isPendingConnect}
            className="focus-ring rounded-full border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
          >
            {isPendingConnect ? "Requested" : "Connect"}
          </button>
          <button
            type="button"
            onClick={() => onMessage(person)}
            className="focus-ring rounded-full border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-50"
          >
            Message
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function FeedPeople() {
  useDocumentTitle("People | Thuto");
  const navigate = useNavigate();
  const { user, supabaseConfigured } = useAuth();
  const [tab, setTab] = useState("discover");
  const [people, setPeople] = useState([]);
  const [followingIds, setFollowingIds] = useState(() => new Set());
  const [pendingConnectIds, setPendingConnectIds] = useState(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPeople = useCallback(async () => {
    if (!user) {
      setPeople([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      let rows = [];
      if (tab === "following") rows = await fetchFollowingProfiles();
      else if (tab === "followers") rows = await fetchFollowerProfiles();
      else rows = await fetchDiscoverProfiles();
      setPeople(rows);
      const ids = rows.map((row) => row.id);
      const [following, pending] = await Promise.all([
        fetchFollowingSetForUsers(ids),
        fetchPendingOutgoingSet(ids),
      ]);
      setFollowingIds(following);
      setPendingConnectIds(pending);
    } catch (err) {
      setError(err.message || "Could not load people.");
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  }, [tab, user]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  async function handleFollow(personId) {
    try {
      const nowFollowing = await toggleFollowUser(personId);
      setFollowingIds((current) => {
        const next = new Set(current);
        if (nowFollowing) next.add(personId);
        else next.delete(personId);
        return next;
      });
    } catch (err) {
      setError(err.message || "Could not update follow.");
    }
  }

  async function handleConnect(personId) {
    try {
      await sendConnectionRequest(personId);
      setPendingConnectIds((current) => new Set(current).add(personId));
    } catch (err) {
      setError(err.message || "Could not send connection request.");
    }
  }

  async function handleMessage(person) {
    try {
      const conversationId = await getOrCreateConversation(person.id);
      navigate(`/feed/messages/${conversationId}`);
    } catch (err) {
      setError(err.message || "Could not open messages.");
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        People need Supabase to be configured on this build.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3 pt-2">
        <h1 className="font-display text-xl font-semibold text-brand-900">People</h1>
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          <Link to="/auth?mode=login&next=%2Ffeed%2Fpeople" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to follow classmates and see who is on Thuto.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900">People</h1>
        <p className="mt-1 text-sm text-stone-600">Follow classmates and send connection requests from their profiles.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-full border border-brand-100 bg-white p-1 shadow-sm">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={[
              "focus-ring rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === item.id ? "bg-brand-700 text-white" : "text-brand-800 hover:bg-brand-50",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? <p className="text-sm text-stone-500">Loading people...</p> : null}

      {!isLoading && !people.length ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-stone-600">
          {tab === "discover" ? "No new people to discover right now." : `No ${tab} yet.`}
        </div>
      ) : null}

      <div className="space-y-2">
        {people.map((person) => (
          <PersonRow
            key={person.id}
            person={person}
            isFollowing={followingIds.has(person.id)}
            isPendingConnect={pendingConnectIds.has(person.id)}
            onFollow={handleFollow}
            onConnect={handleConnect}
            onMessage={handleMessage}
            showActions={user.id !== person.id}
          />
        ))}
      </div>
    </div>
  );
}
